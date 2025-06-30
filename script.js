// Generate random admin fee
function generateAdminFee() {
    return Math.floor(Math.random() * (CONFIG.ADMIN_FEE.MAX - CONFIG.ADMIN_FEE.MIN + 1)) + CONFIG.ADMIN_FEE.MIN;
}

// Create payment
function createPayment() {
    paymentData.adminFee = generateAdminFee();
    paymentData.totalAmount = paymentData.amount + paymentData.adminFee;

    if (paymentData.paymentMethod === 'qris') {
        const url = `${CONFIG.API_BASE_URL}/createpayment?apikey=${CONFIG.API_KEY}&amount=${paymentData.totalAmount}&codeqr=${CONFIG.QR_CODE}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.status) {
                    paymentData.transactionId = data.result.idtransaksi;
                    paymentData.expiredTime = new Date(data.result.expired);
                    qrisImage.src = data.result.imageqris.url;
                    
                    paymentHistory.push({
                        name: paymentData.name,
                        amount: paymentData.totalAmount,
                        date: new Date().toLocaleString('id-ID'),
                        method: CONFIG.PAYMENT_METHODS[paymentData.paymentMethod]
                    });
                    
                    setTimeout(() => {
                        qrLoading.style.display = 'none';
                        qrisImage.style.display = 'block';
                        qrisImage.style.animation = 'fadeIn 0.6s ease-out';
                    }, 500);
                    
                    startCountdown();
                    checkPaymentStatus();
                } else {
                    showError('Gagal membuat QRIS. Silakan coba lagi.');
                    closeModal(qrisModal);
                }
            })
            .catch(error => {
                console.error('Error creating payment:', error);
                showError('Terjadi kesalahan. Silakan coba lagi.');
                closeModal(qrisModal);
            });
    } else {
        openModal(paymentDetailsModal);
        detailName.textContent = paymentData.name;
        detailAmount.textContent = `Rp ${paymentData.totalAmount.toLocaleString('id-ID')} (Pembayaran: Rp ${paymentData.amount.toLocaleString('id-ID')} + Biaya Admin: Rp ${paymentData.adminFee})`;
        detailMethod.textContent = CONFIG.PAYMENT_METHODS[paymentData.paymentMethod];
        detailDate.textContent = new Date().toLocaleString('id-ID');
        
        if (paymentData.paymentMethod === 'e_wallet') {
            detailNumber.textContent = `${CONFIG.PAYMENT_DETAILS.e_wallet.provider}: ${CONFIG.PAYMENT_DETAILS.e_wallet.number} (${CONFIG.PAYMENT_DETAILS.e_wallet.holder})`;
        } else if (paymentData.paymentMethod === 'bank_transfer') {
            detailNumber.textContent = `${CONFIG.PAYMENT_DETAILS.bank_transfer.bank_name}: ${CONFIG.PAYMENT_DETAILS.bank_transfer.account_number} (${CONFIG.PAYMENT_DETAILS.bank_transfer.account_holder})`;
        }
        
        paymentHistory.push({
            name: paymentData.name,
            amount: paymentData.totalAmount,
            date: new Date().toLocaleString('id-ID'),
            method: CONFIG.PAYMENT_METHODS[paymentData.paymentMethod]
        });
    }
}

// Check payment status (for QRIS)
function checkPaymentStatus(isManualCheck = false) {
    if (isManualCheck) {
        checkStatusBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memeriksa...';
        checkStatusBtn.disabled = true;
    }
    
    const url = `${CONFIG.API_BASE_URL}/cekstatus?apikey=${CONFIG.API_KEY}&merchant=${CONFIG.MERCHANT_ID}&keyorkut=${CONFIG.KEY_ORKUT}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.status && parseInt(data.result.amount) === paymentData.totalAmount) {
                clearInterval(paymentData.checkInterval);
                closeModal(qrisModal);
                showSuccessModal();
            } else if (isManualCheck) {
                showError('Pembayaran belum diterima atau tidak sesuai. Silakan coba lagi.');
            }
        })
        .catch(error => {
            console.error('Error checking payment status:', error);
            if (isManualCheck) showError('Terjadi kesalahan saat memeriksa status. Silakan coba lagi.');
        })
        .finally(() => {
            if (isManualCheck) {
                checkStatusBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Cek Status Pembayaran';
                checkStatusBtn.disabled = false;
            }
        });
    
    if (!isManualCheck && !paymentData.checkInterval) {
        paymentData.checkInterval = setInterval(() => checkPaymentStatus(), 5000);
    }
}

// Start countdown timer (for QRIS)
function startCountdown() {
    const update = () => {
        const now = new Date();
        const diff = paymentData.expiredTime - now;
        if (diff <= 0) {
            modalCountdown.textContent = 'Expired';
            clearInterval(interval);
            return;
        }
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        modalCountdown.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (mins === 0 && secs <= 30) {
            modalCountdown.style.animation = 'pulse 1s infinite';
            modalCountdown.style.color = 'var(--danger)';
        }
    };
    update();
    const interval = setInterval(update, 1000);
}

// Fetch payment history (mock function, replace with actual API call)
function fetchPaymentHistory() {
    return paymentHistory;
}

// AI Service: Interact with Gemini 2.5 Flash as Yola
async function getAiResponse(message) {
    if (!CONFIG.GEMINI_API_KEY) {
        return 'TrieStr: Ups, sepertinya ada masalah teknis. Coba lagi nanti ya, bestie!';
    }

    const url = 'https://api.gemini.com/v2.5/flash';
    const prompt = `
        You are TrieStr, a trendy, friendly, and polite female AI for Bayar Kuy, a premium payment platform. You speak in a casual yet respectful tone, like a cool and approachable young woman. Use Indonesian with a modern, friendly vibe, and include terms like "bestie," "kece," or "asik" when appropriate. You can explain:
        - What payment methods are: "Metode pembayaran itu cara kamu bayar, misalnya QRIS, transfer bank, atau e-wallet seperti DANA, OVO, atau GoPay!"
        - How to pay: "Tinggal pilih nominal, metode pembayaran, isi data, dan ikuti langkahnya. Super gampang, deh!"
        - Benefits of each method: "QRIS cepet banget, tinggal scan. E-wallet praktis, nggak perlu ke ATM. Transfer bank cocok buat yang suka manual!"
        - Payment process details: "Kalau QRIS, scan kode QR. Kalau e-wallet, transfer ke nomor tujuan. Kalau bank, kirim ke rekening yang ditunjuk."
        - Other platform-related questions.
        Answer this user query: ${message}
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gemini-2.5-flash',
                prompt: prompt,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return `TrieStr: ${data.choices[0].text.trim()}`;
    } catch (error) {
        console.error('Error fetching AI response:', error);
        return 'TrieStr: Aduh, kayaknya ada masalah teknis nih. Coba lagi nanti ya, bestie!';
    }
}

// DOM and Event Handling
const payerNameInput = document.getElementById('payerName');
const anonymousBtn = document.getElementById('anonymousBtn');
const amountSelectBtn = document.getElementById('amountSelectBtn');
const paymentMethodBtn = document.getElementById('paymentMethodBtn');
const customAmountInput = document.getElementById('customAmount');
const messageGroup = document.getElementById('messageGroup');
const paymentMessage = document.getElementById('paymentMessage');
const charCount = document.getElementById('charCount');
const payBtn = document.getElementById('payBtn');
const historyBtn = document.getElementById('historyBtn');
const amountModal = document.getElementById('amountModal');
const closeAmountModal = document.getElementById('closeAmountModal');
const amountOptions = document.getElementById('amountOptions');
const paymentMethodModal = document.getElementById('paymentMethodModal');
const closePaymentMethodModal = document.getElementById('closePaymentMethodModal');
const paymentOptions = document.getElementById('paymentOptions');
const qrisModal = document.getElementById('qrisModal');
const closeQrisModal = document.getElementById('closeQrisModal');
const qrLoading = document.getElementById('qrLoading');
const qrisImage = document.getElementById('qrisImage');
const modalName = document.getElementById('modalName');
const modalAmount = document.getElementById('modalAmount');
const modalMethod = document.getElementById('modalMethod');
const modalCountdown = document.getElementById('modalCountdown');
const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const paymentDetailsModal = document.getElementById('paymentDetailsModal');
const closePaymentDetailsModal = document.getElementById('closePaymentDetailsModal');
const detailName = document.getElementById('detailName');
const detailAmount = document.getElementById('detailAmount');
const detailMethod = document.getElementById('detailMethod');
const detailNumber = document.getElementById('detailNumber');
const detailDate = document.getElementById('detailDate');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const successModal = document.getElementById('successModal');
const successName = document.getElementById('successName');
const successWish = document.getElementById('successWish');
const doneBtn = document.getElementById('doneBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyContainer = document.getElementById('historyContainer');
const aiServiceBtn = document.getElementById('aiServiceBtn');
const aiChatContainer = document.getElementById('aiChatContainer');
const closeAiChat = document.getElementById('closeAiChat');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatInput = document.getElementById('aiChatInput');
const aiSendBtn = document.getElementById('aiSendBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

function initPage() {
    setTimeout(() => {
        loadingOverlay.classList.add('hidden');
    }, 2000);
    
    renderAmountOptions();
    renderPaymentOptions();
    setupEventListeners();
}

function renderAmountOptions() {
    amountOptions.innerHTML = '';
    CONFIG.DEFAULT_AMOUNTS.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'amount-option';
        optionElement.dataset.value = option.value;
        optionElement.innerHTML = `<span>${option.label}</span>`;
        optionElement.addEventListener('click', () => selectAmount(optionElement));
        amountOptions.appendChild(optionElement);
    });
}

function renderPaymentOptions() {
    paymentOptions.innerHTML = '';
    Object.keys(CONFIG.PAYMENT_METHODS).forEach(key => {
        const optionElement = document.createElement('div');
        optionElement.className = 'payment-option';
        optionElement.dataset.value = key;
        optionElement.innerHTML = `<span>${CONFIG.PAYMENT_METHODS[key]}</span>`;
        optionElement.addEventListener('click', () => selectPaymentMethod(optionElement));
        paymentOptions.appendChild(optionElement);
    });
}

function setupEventListeners() {
    anonymousBtn.addEventListener('click', toggleAnonymous);
    amountSelectBtn.addEventListener('click', () => openModal(amountModal));
    paymentMethodBtn.addEventListener('click', () => openModal(paymentMethodModal));
    customAmountInput.addEventListener('input', handleCustomAmount);
    paymentMessage.addEventListener('input', updateCharCount);
    payBtn.addEventListener('click', handlePayment);
    historyBtn.addEventListener('click', showHistoryModal);
    closeAmountModal.addEventListener('click', () => closeModal(amountModal));
    closePaymentMethodModal.addEventListener('click', () => closeModal(paymentMethodModal));
    closeQrisModal.addEventListener('click', () => closeModal(qrisModal));
    cancelPaymentBtn.addEventListener('click', cancelPayment);
    checkStatusBtn.addEventListener('click', () => checkPaymentStatus(true));
    closePaymentDetailsModal.addEventListener('click', () => closeModal(paymentDetailsModal));
    confirmPaymentBtn.addEventListener('click', () => {
        closeModal(paymentDetailsModal);
        showSuccessModal();
    });
    doneBtn.addEventListener('click', () => closeModal(successModal));
    closeHistoryModal.addEventListener('click', () => closeModal(historyModal));
    aiServiceBtn.addEventListener('click', toggleAiChat);
    closeAiChat.addEventListener('click', () => aiChatContainer.style.display = 'none');
    aiSendBtn.addEventListener('click', sendAiMessage);
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAiMessage();
    });
}

function toggleAnonymous() {
    paymentData.isAnonymous = !paymentData.isAnonymous;
    anonymousBtn.classList.toggle('active', paymentData.isAnonymous);
    payerNameInput.value = '';
    payerNameInput.disabled = paymentData.isAnonymous;
    payerNameInput.placeholder = paymentData.isAnonymous ? 'Anonim' : 'Masukkan nama Anda';
    
    anonymousBtn.classList.add('animate');
    setTimeout(() => anonymousBtn.classList.remove('animate'), 400);
}

function selectAmount(selectedOption) {
    document.querySelectorAll('.amount-option').forEach(option => option.classList.remove('selected'));
    selectedOption.classList.add('selected');
    paymentData.amount = parseInt(selectedOption.dataset.value);
    customAmountInput.value = '';
    closeModal(amountModal);
    amountSelectBtn.textContent = selectedOption.textContent;
    toggleMessageInput();
}

function handleCustomAmount() {
    document.querySelectorAll('.amount-option').forEach(option => option.classList.remove('selected'));
    paymentData.amount = parseInt(customAmountInput.value) || 0;
    amountSelectBtn.textContent = paymentData.amount ? `Rp ${paymentData.amount.toLocaleString('id-ID')}` : 'Pilih Nominal';
    toggleMessageInput();
}

function selectPaymentMethod(selectedOption) {
    document.querySelectorAll('.payment-option').forEach(option => option.classList.remove('selected'));
    selectedOption.classList.add('selected');
    paymentData.paymentMethod = selectedOption.dataset.value;
    paymentMethodBtn.textContent = CONFIG.PAYMENT_METHODS[paymentData.paymentMethod];
    closeModal(paymentMethodModal);
}

function toggleMessageInput() {
    if (paymentData.amount >= CONFIG.MESSAGE_LIMITS.MIN_AMOUNT_FOR_MESSAGE) {
        messageGroup.style.display = 'block';
        let charLimit = paymentData.amount >= 20000 ? CONFIG.MESSAGE_LIMITS[20000] :
                       paymentData.amount >= 10000 ? CONFIG.MESSAGE_LIMITS[10000] :
                       CONFIG.MESSAGE_LIMITS[5000];
        paymentMessage.maxLength = charLimit;
        charCount.textContent = `0/${charLimit}`;
    } else {
        messageGroup.style.display = 'none';
        paymentMessage.value = '';
    }
}

function updateCharCount() {
    const currentLength = paymentMessage.value.length;
    const maxLength = paymentMessage.maxLength;
    charCount.textContent = `${currentLength}/${maxLength}`;
}

function handlePayment() {
    if (!validatePaymentForm()) return;
    
    payBtn.classList.add('processing');
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    paymentData.name = paymentData.isAnonymous ? 'Anonim' : payerNameInput.value;
    paymentData.message = paymentMessage.value;
    
    setTimeout(() => {
        payBtn.classList.remove('processing');
        payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Lanjutkan Pembayaran';
        if (paymentData.paymentMethod === 'qris') {
            openModal(qrisModal);
            modalName.textContent = paymentData.name;
            modalAmount.textContent = `Rp ${paymentData.totalAmount.toLocaleString('id-ID')} (Pembayaran: Rp ${paymentData.amount.toLocaleString('id-ID')} + Biaya Admin: Rp ${paymentData.adminFee})`;
            modalMethod.textContent = CONFIG.PAYMENT_METHODS[paymentData.paymentMethod];
            qrLoading.style.display = 'flex';
            qrisImage.style.display = 'none';
        }
        createPayment();
    }, 1000);
}

function validatePaymentForm() {
    if (!paymentData.isAnonymous && !payerNameInput.value.trim()) {
        showError('Silakan masukkan nama Anda atau pilih Anonim');
        return false;
    }
    if (!paymentData.amount || paymentData.amount <= 0) {
        showError('Silakan pilih atau masukkan nominal pembayaran');
        return false;
    }
    if (!paymentData.paymentMethod) {
        showError('Silakan pilih metode pembayaran');
        return false;
    }
    return true;
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.position = 'fixed';
    errorElement.style.bottom = '50px';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translateX(-50%)';
    errorElement.style.backgroundColor = 'var(--danger)';
    errorElement.style.color = 'white';
    errorElement.style.padding = '25px 35px';
    errorElement.style.borderRadius = 'var(--radius-sm)';
    errorElement.style.boxShadow = 'var(--shadow)';
    errorElement.style.zIndex = '1000';
    errorElement.style.animation = 'fadeIn 0.5s ease-out';
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => errorElement.remove(), 500);
    }, 4000);
}

function showSuccessModal() {
    successName.textContent = paymentData.name;
    const randomIndex = Math.floor(Math.random() * CONFIG.SUCCESS_MESSAGES.length);
    successWish.textContent = CONFIG.SUCCESS_MESSAGES[randomIndex];
    openModal(successModal);
}

function cancelPayment() {
    clearInterval(paymentData.checkInterval);
    closeModal(qrisModal);
}

function showHistoryModal() {
    const history = fetchPaymentHistory();
    historyContainer.innerHTML = '';
    if (history.length === 0) {
        historyContainer.innerHTML = '<p>Tidak ada riwayat pembayaran.</p>';
    } else {
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="name">${item.name}</span>
                <span class="amount">Rp ${item.amount.toLocaleString('id-ID')}</span>
                <span class="date">${item.date}</span>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
    openModal(historyModal);
}

function toggleAiChat() {
    aiChatContainer.style.display = aiChatContainer.style.display === 'none' ? 'block' : 'none';
}

async function sendAiMessage() {
    const message = aiChatInput.value.trim();
    if (!message) return;

    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message user';
    userMessage.textContent = message;
    aiChatMessages.appendChild(userMessage);
    aiChatInput.value = '';

    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const typingMessage = document.createElement('div');
    typingMessage.className = 'ai-message typing';
    typingMessage.innerHTML = `
        <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
        TrieStr sedang mengetik...
    `;
    aiChatMessages.appendChild(typingMessage);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const response = await getAiResponse(message);
    
    typingMessage.remove();

    const botMessage = document.createElement('div');
    botMessage.className = 'ai-message bot';
    botMessage.textContent = response;
    aiChatMessages.appendChild(botMessage);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

function openModal(modal) {
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
}

function closeModal(modal) {
    document.body.style.overflow = '';
    modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', initPage);
