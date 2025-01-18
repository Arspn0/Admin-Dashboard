// admin.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
    // Your Firebase config here
    databaseURL: "https://basreng-store-data-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Admin credentials (In production, this should be handled securely)
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
});

// Load and display orders
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        updateDashboardStats(orders);
        displayOrders(orders);
    });
}

// Update dashboard statistics
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