// --- Mock Data Produk ---
const products = [
    { id: 1, name: 'Lampu Gantung Nordic Emas', price: 1250000, category: 'Dekoratif', color: 'Emas', description: 'Siluet minimalis dengan finishing emas elegan, menciptakan fokus dramatis di ruang Anda. ', isFeatured: true, imageUrl: 'https://placehold.co/500x500/000000/FACC15?text=Lampu+Emas+Nordic' },
    { id: 2, name: 'Lampu Meja Geometris Hitam', price: 450000, category: 'Fungsional', color: 'Hitam', description: 'Lampu meja fungsional dengan desain geometris hitam matte. Cahaya terfokus, ideal untuk membaca. ', isFeatured: true, imageUrl: 'https://placehold.co/500x500/000000/FFFFFF?text=Lampu+Meja+Hitam' },
    { id: 3, name: 'Lampu Dinding Kristal', price: 980000, category: 'Dekoratif', color: 'Perak', description: 'Aksen lampu dinding kristal yang memancarkan cahaya lembut dan mewah. Sempurna untuk lorong. ', isFeatured: false, imageUrl: 'https://placehold.co/500x500/000000/E5E7EB?text=Lampu+Dinding+Kristal' },
    { id: 4, name: 'Lampu Lantai Studio Putih', price: 1800000, category: 'Pencahayaan Rumah', color: 'Putih', description: 'Lampu lantai bergaya studio yang memberikan pencahayaan ambient yang merata dan terang. ', isFeatured: true, imageUrl: 'https://placehold.co/500x500/000000/FFFFFF?text=Lampu+Lantai+Putih' },
    { id: 5, name: 'Lampu Track Hitam Klasik', price: 210000, category: 'Fungsional', color: 'Hitam', description: 'Lampu track yang dapat diatur untuk menyorot karya seni atau area spesifik. Efisien dan modern. ', isFeatured: false, imageUrl: 'https://placehold.co/500x500/000000/FFFFFF?text=Lampu+Track+Hitam' },
    { id: 6, name: 'Lampu Gantung Bulat Minimalis', price: 650000, category: 'Dekoratif', color: 'Perak', description: 'Lampu gantung bulat dengan kabel tipis, menghadirkan kesan melayang dan ringan. ', isFeatured: false, imageUrl: 'https://placehold.co/500x500/000000/E5E7EB?text=Lampu+Gantung+Bulat' },
];

// --- State Management Sederhana ---
let appState = {
    currentPage: window.location.pathname.split('/').pop().split('.')[0] || 'index',
    currentProduct: null, // Untuk halaman detail produk
    cart: JSON.parse(localStorage.getItem('cart')) || [], // { productId, name, price, quantity, imageUrl }
    filters: { category: 'Semua', color: 'Semua' }
};

// --- Utils ---

/** Memformat angka menjadi Rupiah (IDR) */
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

/** Memperbarui jumlah item di keranjang */
const updateCartCount = () => {
    const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
};

/** Menyimpan keranjang ke localStorage */
const saveCartToLocalStorage = () => {
    localStorage.setItem('cart', JSON.stringify(appState.cart));
};

// --- Fungsionalitas Keranjang ---

const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = appState.cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl
        });
    }

    // Tampilkan pesan sukses menggunakan SweetAlert dengan tema gelap
    Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `"${product.name}" telah ditambahkan ke keranjang.`,
        showConfirmButton: false,
        timer: 1500,
        ...successSwalConfig
    });
    
    saveCartToLocalStorage();
    updateCartCount();
};

const updateCartItemQuantity = (productId, newQuantity) => {
    const itemIndex = appState.cart.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
        if (newQuantity > 0) {
            appState.cart[itemIndex].quantity = newQuantity;
        } else {
            appState.cart.splice(itemIndex, 1); // Hapus jika kuantitas 0
        }
    }
    saveCartToLocalStorage();
    updateCartCount();
    
    // Re-render cart page if we're on the cart page
    if (window.location.href.includes('cart.html')) {
        renderCartPage();
    }
};

// --- Komponen Rendering ---

const renderProductCard = (product) => {
    return `
        <div class="product-card bg-dark-bg border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-gold/50 cursor-pointer p-4 md:p-6 shadow-2xl">
            <div onclick="location.href='./detail.html?id=${product.id}'" class="space-y-4">
                <div class="glow-effect aspect-square overflow-hidden rounded-lg transition-all duration-300">
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform hover:scale-105 transition duration-500">
                </div>
                <h3 class="text-xl font-semibold text-light-text hover:text-primary-gold transition duration-200">${product.name}</h3>
                <p class="text-2xl font-bold text-primary-gold">${formatRupiah(product.price)}</p>
            </div>
            <button onclick="addToCart(${product.id})" class="mt-4 w-full bg-light-text text-dark-bg py-2 rounded-lg font-medium hover:bg-white transition duration-300 border border-light-text">
                Tambahkan ke Keranjang
            </button>
        </div>
    `;
};

const renderDetailPage = (product) => {
    return `
        <div class="bg-dark-bg p-4 md:p-8 rounded-xl shadow-2xl border border-white/10">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <!-- Product Image -->
                <div class="aspect-square overflow-hidden rounded-lg glow-border border-2 border-white/10">
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover">
                </div>

                <!-- Product Info -->
                <div class="space-y-6">
                    <h1 class="text-4xl md:text-5xl font-extrabold text-light-text">${product.name}</h1>
                    <p class="text-3xl font-bold text-primary-gold">${formatRupiah(product.price)}</p>

                    <p class="text-gray-400 leading-relaxed">${product.description}</p>

                    <!-- Spesifikasi Teknis (Mockup) -->
                    <div class="border-t border-b border-white/10 py-4">
                        <h3 class="text-xl font-semibold mb-2 text-primary-gold">Spesifikasi Teknis</h3>
                        <ul class="space-y-1 text-sm text-gray-400">
                            <li>Kategori: <span class="text-light-text">${product.category}</span></li>
                            <li>Warna Aksen: <span class="text-light-text">${product.color}</span></li>
                            <li>Daya: <span class="text-light-text">40 Watt (Max)</span></li>
                            <li>Material: <span class="text-light-text">Besi & Akrilik</span></li>
                        </ul>
                    </div>

                    <!-- Tambah ke Keranjang -->
                    <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <button onclick="addToCart(${product.id})" class="flex-1 bg-primary-gold text-dark-bg text-lg font-semibold py-3 rounded-full transition duration-300 hover:bg-yellow-300 transform hover:scale-[1.02]">
                            <svg class="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Tambah ke Keranjang
                        </button>
                    </div>

                     <div class="mt-6">
                        <a href="./shop.html" class="text-gray-500 hover:text-light-text transition duration-200">
                            &larr; Kembali ke Koleksi
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderCartPage = () => {
    const container = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('checkout-summary');
    
    if (!container || !summaryContainer) return;

    if (appState.cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 border-2 border-dashed border-white/10 p-8 rounded-xl">
                <svg class="w-16 h-16 mx-auto mb-4 text-primary-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <h2 class="text-3xl font-bold text-light-text mb-2">Keranjang Anda Kosong</h2>
                <p class="text-gray-500 mb-6">Temukan pencahayaan yang sempurna untuk gaya Anda.</p>
                <a href="./shop.html" class="inline-block bg-primary-gold text-dark-bg py-2 px-6 rounded-full font-semibold hover:bg-yellow-300 transition duration-300">
                    Mulai Belanja Sekarang
                </a>
            </div>
        `;
        summaryContainer.innerHTML = '';
        return;
    }

    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 50000; // Contoh biaya pengiriman
    const total = subtotal + shipping;

    const cartItemsHtml = appState.cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="flex items-center space-x-4 border-b border-white/10 py-6">
                <!-- Gambar -->
                <div class="w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
                    <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                
                <!-- Nama & Detail -->
                <div class="flex-grow">
                    <h3 class="text-lg font-semibold text-light-text">${item.name}</h3>
                    <p class="text-primary-gold font-medium">${formatRupiah(item.price)}</p>
                </div>
                
                <!-- Kuantitas -->
                <div class="flex items-center border border-white/20 rounded-md">
                    <button onclick="updateCartItemQuantity(${item.productId}, ${item.quantity - 1})" class="p-2 hover:bg-white/10 rounded-l">-</button>
                    <span class="px-3">${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${item.productId}, ${item.quantity + 1})" class="p-2 hover:bg-white/10 rounded-r">+</button>
                </div>

                <!-- Subtotal Item -->
                <p class="font-bold text-light-text hidden sm:block w-32 text-right">${formatRupiah(itemTotal)}</p>

                <!-- Hapus -->
                <button onclick="updateCartItemQuantity(${item.productId}, 0)" class="text-gray-500 hover:text-red-500 transition duration-200 ml-4">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
    }).join('');

    container.innerHTML = cartItemsHtml;

    summaryContainer.innerHTML = `
        <h3 class="text-2xl font-bold mb-6 text-light-text border-b border-white/10 pb-3">Ringkasan Pesanan</h3>
        
        <div class="space-y-3 text-lg">
            <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>${formatRupiah(subtotal)}</span>
            </div>
            <div class="flex justify-between">
                <span>Pengiriman:</span>
                <span>${formatRupiah(shipping)}</span>
            </div>
            <div class="flex justify-between font-bold text-xl border-t border-primary-gold pt-4 mt-4 text-primary-gold">
                <span>Total:</span>
                <span>${formatRupiah(total)}</span>
            </div>
        </div>

        <button onclick="simulateCheckout('${formatRupiah(total)}')" class="mt-8 w-full bg-primary-gold text-dark-bg text-lg font-bold py-3 rounded-full hover:bg-yellow-300 transition duration-300">
            Lanjutkan ke Checkout
        </button>
    `;
};

// Konfigurasi tema gelap untuk SweetAlert
const darkSwalConfig = {
    background: '#000000',
    color: '#E5E7EB',
    confirmButtonColor: '#FACC15',
};

const successSwalConfig = {
    ...darkSwalConfig,
    iconColor: '#4ADE80', // Warna sukses hijau muda
};

const errorSwalConfig = {
    ...darkSwalConfig,
    iconColor: '#F87171', // Warna error merah muda
};

// Fungsi untuk redirect ke halaman checkout
function simulateCheckout(total) {
    console.log('Redirecting to checkout. Total: ' + total);
    window.location.href = 'checkout.html';
}

const renderShopPage = () => {
    const { category, color } = appState.filters;
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    const uniqueColors = [...new Set(products.map(p => p.color))];

    const filteredProducts = products.filter(product => {
        const categoryMatch = category === 'Semua' || product.category === category;
        const colorMatch = color === 'Semua' || product.color === color;
        return categoryMatch && colorMatch;
    });

    const container = document.getElementById('product-grid');
    const noProductsMessage = document.getElementById('no-products-message');
    
    if (!container || !noProductsMessage) return;

    if (filteredProducts.length > 0) {
        container.innerHTML = filteredProducts.map(renderProductCard).join('');
        noProductsMessage.classList.add('hidden');
    } else {
        container.innerHTML = '';
        noProductsMessage.classList.remove('hidden');
    }
};

// Initialize cart count when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});