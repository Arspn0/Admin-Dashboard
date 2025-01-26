import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
    databaseURL: "https://basreng-store-data-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            loadOrders();
        } else {
            alert('Invalid credentials!');
        }
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function() {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
    });

    // Navigation handler
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');

            // Show/hide corresponding sections
            const sectionToShow = this.dataset.section;
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = section.id === `${sectionToShow}Section` ? 'block' : 'none';
            });
        });
    });
});

// Load and display orders
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        updateDashboardStats(orders);
        displayOrders(orders);
        generateGraphs(orders);
    });
}

// Generate graphs for sales and revenue
function generateGraphs(orders) {
    if (!orders) return;

    // Process orders by date
    const dailyData = processOrdersByDate(orders);

    // Sales Volume Chart
    const salesVolumeCtx = document.getElementById('salesVolumeChart').getContext('2d');
    new Chart(salesVolumeCtx, {
        type: 'bar',
        data: {
            labels: dailyData.dates,
            datasets: [{
                label: 'Number of Orders',
                data: dailyData.salesVolume,
                backgroundColor: 'rgba(255, 159, 13, 0.6)',
                borderColor: 'rgba(255, 159, 13, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Orders'
                    }
                }
            }
        }
    });

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: dailyData.dates,
            datasets: [{
                label: 'Daily Revenue',
                data: dailyData.revenue,
                backgroundColor: 'rgba(13, 159, 255, 0.6)',
                borderColor: 'rgba(13, 159, 255, 1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (Rp)'
                    }
                }
            }
        }
    });
}

// Process orders to get daily sales and revenue
function processOrdersByDate(orders) {
    const dailyData = {};

    // Convert orders to an array and group by date
    Object.values(orders).forEach(order => {
        const date = new Date(order.orderDate).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
            dailyData[date] = {
                salesVolume: 0,
                revenue: 0
            };
        }

        dailyData[date].salesVolume++;
        dailyData[date].revenue += order.total;
    });

    // Sort dates and prepare data for charts
    const sortedDates = Object.keys(dailyData).sort();
    
    return {
        dates: sortedDates,
        salesVolume: sortedDates.map(date => dailyData[date].salesVolume),
        revenue: sortedDates.map(date => dailyData[date].revenue)
    };
}

// Update dashboard statistics function
function updateDashboardStats(orders) {
    if (!orders) return;

    const ordersList = Object.values(orders);
    const totalOrders = ordersList.length;
    const totalRevenue = ordersList.reduce((sum, order) => sum + order.total, 0);
    
    // Count today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = ordersList.filter(order => 
        order.orderDate.split('T')[0] === today
    ).length;

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('totalRevenue').textContent = `Rp${totalRevenue.toLocaleString()}`;
}

// Display orders in table
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    if (!orders) {
        tableBody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
        return;
    }

    Object.entries(orders).forEach(([orderId, order]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${orderId.slice(-6)}</td>
            <td>${new Date(order.orderDate).toLocaleString()}</td>
            <td>${formatOrderItems(order.items)}</td>
            <td>Rp${order.total.toLocaleString()}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status}
                </span>
            </td>
            <td>
                ${order.status === 'pending' ? 
                    `<button class="action-btn btn-complete" onclick="completeOrder('${orderId}')">
                        Complete
                    </button>` : ''
                }
                <button class="action-btn btn-delete" onclick="deleteOrder('${orderId}')">
                    Delete
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Format order items for display
function formatOrderItems(items) {
    return items.map(item => 
        `${item.name} (${item.quantity}x)`
    ).join(', ');
}

// Complete order
window.completeOrder = function(orderId) {
    const orderRef = ref(database, `orders/${orderId}`);
    update(orderRef, {
        status: 'completed'
    }).then(() => {
        alert('Order marked as completed!');
    }).catch(error => {
        console.error('Error completing order:', error);
        alert('Error updating order status');
    });
}

// Delete order
window.deleteOrder = function(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        const orderRef = ref(database, `orders/${orderId}`);
        remove(orderRef).then(() => {
            alert('Order deleted successfully!');
        }).catch(error => {
            console.error('Error deleting order:', error);
            alert('Error deleting order');
        });
    }
}