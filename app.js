// Mock Medicine Database
const MEDICINES = {
    paracetamol: { name: 'Paracetamol (Crocin)', price: 15, stock: 100, dosage: ['500mg', '650mg'] },
    ibuprofen: { name: 'Ibuprofen (Brufen)', price: 25, stock: 80, dosage: ['200mg', '400mg'] },
    decold: { name: 'DeCold', price: 35, stock: 60, dosage: ['1 tab', '2 tabs'] },
    sinex: { name: 'Sinex', price: 40, stock: 50, dosage: ['Standard'] },
    cetirizine: { name: 'Cetirizine', price: 20, stock: 90, dosage: ['10mg'] },
    azithromycin: { name: 'Azithromycin', price: 120, stock: 40, dosage: ['250mg', '500mg'] },
    coughsyrup: { name: 'Cough Syrup (Broncho)', price: 45, stock: 70, dosage: ['100ml'] },
    ors: { name: 'ORS', price: 10, stock: 150, dosage: ['1 sachet'] }
};

// Mock Doctors Database
const DOCTORS = [
    { id: 1, name: 'Dr. Sharma', specialty: 'General Physician', rating: 4.8, type: 'online', fee: 500 },
    { id: 2, name: 'Dr. Patel', specialty: 'Cardiologist', rating: 4.9, type: 'nearby', fee: 800 },
    { id: 3, name: 'Dr. Thapa', specialty: 'Pulmonologist', rating: 4.7, type: 'online', fee: 700 },
    { id: 4, name: 'Dr. Gurung', specialty: 'Internal Medicine', rating: 4.6, type: 'nearby', fee: 600 }
];

// State Management
let cart = [];
let subscription = null;
let selectedDoctor = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateCartBadge();
    document.getElementById('appointmentDate').min = new Date().toISOString().split('T')[0];
});

// Symptom Analysis Engine - Core Rule-Based Logic
function analyzeSymptoms() {
    const input = document.getElementById('symptomInput').value.toLowerCase().trim();
    if (!input) return showToast('Please describe your symptoms');
    
    // Save to history
    saveToHistory('symptom', input);
    
    // URGENT SYMPTOMS - Require doctor consultation
    const urgentKeywords = ['chest pain', 'breathing difficulty', 'severe pain', 'high fever', 'rash', 'unconscious', 'blood', 'seizure'];
    const hasUrgent = urgentKeywords.some(k => input.includes(k));
    
    if (hasUrgent) {
        showDoctorRecommendation();
        return;
    }
    
    // MEDICINE RECOMMENDATION LOGIC - Extensible if/else rules
    let recommendations = [];
    
    // Rule: Fever symptoms
    if (input.includes('fever') || input.includes('temperature') || input.includes('hot')) {
        recommendations.push('paracetamol');
    }
    
    // Rule: Headache
    if (input.includes('headache') || input.includes('head pain') || input.includes('migraine')) {
        recommendations.push('ibuprofen');
    }
    
    // Rule: Cold/Flu symptoms
    if (input.includes('cold') || input.includes('flu') || input.includes('runny nose') || input.includes('sneezing')) {
        recommendations.push('decold');
        recommendations.push('sinex');
    }
    
    // Rule: Cough
    if (input.includes('cough') || input.includes('throat')) {
        recommendations.push('coughsyrup');
    }
    
    // Rule: Allergy symptoms
    if (input.includes('allergy') || input.includes('itching') || input.includes('rash') || input.includes('hives')) {
        recommendations.push('cetirizine');
    }
    
    // Rule: Body pain/inflammation
    if (input.includes('body pain') || input.includes('muscle pain') || input.includes('inflammation')) {
        recommendations.push('ibuprofen');
    }
    
    // Rule: Infection symptoms
    if (input.includes('infection') || input.includes('bacterial')) {
        recommendations.push('azithromycin');
    }
    
    // Rule: Dehydration/diarrhea
    if (input.includes('diarrhea') || input.includes('dehydration') || input.includes('loose motion')) {
        recommendations.push('ors');
    }
    
    // Display results
    if (recommendations.length > 0) {
        displayMedicineResults(recommendations);
    } else {
        showDoctorRecommendation();
        showToast('No specific medicine found. Please consult a doctor.');
    }
}

// Quick symptom selection
function quickSymptom(symptom) {
    document.getElementById('symptomInput').value = symptom;
    analyzeSymptoms();
}

// Display medicine recommendations
function displayMedicineResults(medicineKeys) {
    const section = document.getElementById('resultsSection');
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';
    
    medicineKeys.forEach(key => {
        const med = MEDICINES[key];
        if (!med) return;
        
        const card = document.createElement('div');
        card.className = 'card medicine-card';
        card.innerHTML = `
            <div class="medicine-header">
                <h3>${med.name}</h3>
                <div class="price">Rs ${med.price}</div>
                <div class="stock">In Stock: ${med.stock}</div>
            </div>
            <div class="dosage-options">
                ${med.dosage.map((d, i) => `
                    <button class="dosage-btn ${i === 0 ? 'active' : ''}" onclick="selectDosage(this, '${key}')">${d}</button>
                `).join('')}
            </div>
            <div class="quantity-control">
                <button onclick="changeQuantity('${key}', -1)">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
                </button>
                <span id="qty-${key}">1</span>
                <button onclick="changeQuantity('${key}', 1)">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
            </div>
            <button class="btn-primary btn-block" onclick="addToCart('${key}')">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
    
    section.style.display = 'block';
    document.getElementById('doctorsSection').style.display = 'none';
    section.scrollIntoView({ behavior: 'smooth' });
}

// Dosage selection
function selectDosage(btn, medKey) {
    btn.parentElement.querySelectorAll('.dosage-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Quantity control
function changeQuantity(medKey, delta) {
    const qtyEl = document.getElementById(`qty-${medKey}`);
    let qty = parseInt(qtyEl.textContent) + delta;
    if (qty < 1) qty = 1;
    if (qty > 10) qty = 10;
    qtyEl.textContent = qty;
}

// Add to cart
function addToCart(medKey) {
    const med = MEDICINES[medKey];
    const dosageBtn = document.querySelector(`.medicine-card:has(#qty-${medKey}) .dosage-btn.active`);
    const dosage = dosageBtn?.textContent || med.dosage[0];
    const quantity = parseInt(document.getElementById(`qty-${medKey}`).textContent);
    
    const existingItem = cart.find(item => item.key === medKey && item.dosage === dosage);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ key: medKey, name: med.name, dosage, price: med.price, quantity });
    }
    
    updateCart();
    showToast(`${med.name} added to cart!`);
}

// Update cart display
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotals = document.getElementById('cartTotals');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center;color:var(--text-light);">Your cart is empty</p>';
        cartTotals.innerHTML = '';
        updateCartBadge();
        return;
    }
    
    // Display cart items
    cartItems.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-dose">${item.dosage} × ${item.quantity}</div>
                <div class="cart-item-price">Rs ${item.price * item.quantity}</div>
            </div>
            <button class="btn-icon" onclick="removeFromCart(${i})">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
    `).join('');
    
    // Calculate totals with subscription discount
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    let discountRate = 0;
    let maxDiscount = 0;
    
    if (subscription === 'basic') {
        discountRate = 0.07;
        maxDiscount = 100;
    } else if (subscription === 'premium') {
        discountRate = 0.15;
        maxDiscount = 200;
    }
    
    if (discountRate > 0) {
        discount = Math.min(subtotal * discountRate, maxDiscount);
    }
    
    const total = subtotal - discount;
    
    cartTotals.innerHTML = `
        <div class="cart-total-row">
            <span>Subtotal:</span>
            <span>Rs ${subtotal.toFixed(2)}</span>
        </div>
        ${discount > 0 ? `
            <div class="cart-total-row" style="color:var(--success)">
                <span>Discount ${subscription === 'basic' ? '(Basic)' : '(Premium)'}:</span>
                <span>-Rs ${discount.toFixed(2)}</span>
            </div>
        ` : ''}
        <div class="cart-total-row final">
            <span>Total:</span>
            <span>Rs ${total.toFixed(2)}</span>
        </div>
    `;
    
    updateCartBadge();
    saveState();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Update cart badge
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

// Toggle cart drawer
function toggleCart() {
    document.getElementById('cartDrawer').classList.toggle('open');
}

// Checkout
function checkout() {
    if (cart.length === 0) return showToast('Cart is empty');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (subscription === 'basic') discount = Math.min(subtotal * 0.07, 100);
    if (subscription === 'premium') discount = Math.min(subtotal * 0.15, 200);
    const total = subtotal - discount;
    
    saveToHistory('purchase', { items: [...cart], subtotal, discount, total });
    
    showToast(`Order placed! Total: Rs ${total.toFixed(2)}`);
    cart = [];
    updateCart();
    toggleCart();
}

// Show doctor recommendation (from symptom analysis or direct booking)
function showDoctorRecommendation() {
    showDoctors(true);
}

// Show doctors list - can be called directly from header or from urgent symptoms
function showDoctors(isUrgent = false) {
    const section = document.getElementById('doctorsSection');
    const grid = document.getElementById('doctorsGrid');
    const banner = section.querySelector('.urgent-banner');
    
    // Show/hide urgent banner
    if (banner) {
        banner.style.display = isUrgent ? 'flex' : 'none';
    }
    
    grid.innerHTML = '';
    
    DOCTORS.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'card doctor-card';
        card.innerHTML = `
            <div class="doctor-avatar">${doc.name.charAt(3)}</div>
            <div class="doctor-name">${doc.name}</div>
            <div class="doctor-specialty">${doc.specialty}</div>
            <div class="doctor-rating">
                <svg width="16" height="16" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ${doc.rating}
            </div>
            <div class="doctor-tag">${doc.type === 'online' ? '🟢 Online' : '📍 Nearby'}</div>
            <div style="margin:12px 0;font-weight:600;color:var(--primary)">Rs ${doc.fee}</div>
            <button class="btn-primary btn-block" onclick="bookAppointment(${doc.id})">Book Appointment</button>
        `;
        grid.appendChild(card);
    });
    
    section.style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    section.scrollIntoView({ behavior: 'smooth' });
}

// Book appointment
function bookAppointment(docId) {
    selectedDoctor = DOCTORS.find(d => d.id === docId);
    const modal = document.getElementById('appointmentModal');
    const details = document.getElementById('appointmentDetails');
    
    let fee = selectedDoctor.fee;
    let discount = 0;
    if (subscription === 'premium') {
        discount = Math.min(fee * 0.15, 150);
        fee -= discount;
    }
    
    details.innerHTML = `
        <div style="background:var(--bg-gray);padding:16px;border-radius:var(--radius);margin-bottom:20px;">
            <h3>${selectedDoctor.name}</h3>
            <p>${selectedDoctor.specialty}</p>
            <div style="font-size:20px;font-weight:700;color:var(--primary);margin-top:8px;">
                ${discount > 0 ? `<span style="text-decoration:line-through;color:var(--text-light);font-size:16px;">Rs ${selectedDoctor.fee}</span> ` : ''}
                Rs ${fee}
                ${discount > 0 ? '<span class="discount-badge">Premium 15% Off</span>' : ''}
            </div>
        </div>
    `;
    
    modal.classList.add('open');
}

// Confirm appointment
function confirmAppointment() {
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const name = document.getElementById('patientName').value;
    const phone = document.getElementById('patientPhone').value;
    
    if (!date || !name || !phone) return showToast('Please fill all fields');
    
    const appointment = {
        doctor: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date, time, name, phone,
        fee: selectedDoctor.fee,
        discount: subscription === 'premium' ? Math.min(selectedDoctor.fee * 0.15, 150) : 0
    };
    
    saveToHistory('appointment', appointment);
    showToast('Appointment booked successfully!');
    closeModal('appointmentModal');
    
    // Reset form
    document.getElementById('patientName').value = '';
    document.getElementById('patientPhone').value = '';
}

// Subscription management
function showSubscription() {
    document.getElementById('subscriptionModal').classList.add('open');
}

function selectPlan(plan) {
    subscription = plan;
    saveState();
    showToast(`${plan === 'basic' ? 'Basic' : 'Premium'} subscription activated!`);
    closeModal('subscriptionModal');
    updateCart(); // Recalculate with new discount
}

// History management
function showHistory() {
    const history = JSON.parse(localStorage.getItem('meroDoctor_history') || '[]');
    const content = document.getElementById('historyContent');
    
    if (history.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-light);">No history yet</p>';
    } else {
        content.innerHTML = history.reverse().map(item => `
            <div class="history-item">
                <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
                <strong>${item.type.toUpperCase()}</strong>
                ${item.type === 'symptom' ? `<p>Symptoms: ${item.data}</p>` : ''}
                ${item.type === 'purchase' ? `<p>Items: ${item.data.items.length} | Total: Rs ${item.data.total.toFixed(2)}</p>` : ''}
                ${item.type === 'appointment' ? `<p>Dr. ${item.data.doctor} - ${item.data.date} ${item.data.time}</p>` : ''}
            </div>
        `).join('');
    }
    
    document.getElementById('historyModal').classList.add('open');
}

function saveToHistory(type, data) {
    const history = JSON.parse(localStorage.getItem('meroDoctor_history') || '[]');
    history.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('meroDoctor_history', JSON.stringify(history));
}

// Modal management
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// State persistence
function saveState() {
    localStorage.setItem('meroDoctor_cart', JSON.stringify(cart));
    localStorage.setItem('meroDoctor_subscription', subscription);
}

function loadState() {
    cart = JSON.parse(localStorage.getItem('meroDoctor_cart') || '[]');
    subscription = localStorage.getItem('meroDoctor_subscription');
    updateCart();
}

// Close modals on outside click
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('open');
    }
};