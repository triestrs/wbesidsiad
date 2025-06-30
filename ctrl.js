// Konfigurasi API dan Telegram
const CONFIG = {
    API_BASE_URL: 'https://restapi-v2.simplebot.my.id/orderkuota',
    API_KEY: 'new2025',
    MERCHANT_ID: 'OK2402210',
    QR_CODE: '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214234313831933610303UMI51440014ID.CO.QRIS.WWW0215ID20253986996400303UMI5204541153033605802ID5924TOKO MADE CELL OK24022106008DENPASAR61058001662070703A016304BA5E',
    KEY_ORKUT: '176054317509995102402210OKCT6D7CB781A600E602791D94926C1CB61D',
    GEMINI_API_KEY: 'AIzaSyDFvom91fmOKqAX3KBEf0I3nMniOgcKIxA',
    SITE_NAME: 'Web Pay',
    SITE_DESCRIPTION: 'Platform pembayaran dengan berbagai metode',
    OWNER_NAME: 'Trie Str',
    DEFAULT_AMOUNTS: [
        { value: 5000, label: 'Rp 5.000' },
        { value: 10000, label: 'Rp 10.000' },
        { value: 20000, label: 'Rp 20.000' },
        { value: 50000, label: 'Rp 50.000' },
        { value: 100000, label: 'Rp 100.000' }
    ],
    PAYMENT_METHODS: {
        qris: 'QRIS',
        bank_transfer: 'Transfer Bank',
        e_wallet: 'E-Wallet'
    },
    PAYMENT_DETAILS: {
        bank_transfer: {
            bank_name: 'Bank XYZ',
            account_number: '1234567890',
            account_holder: 'Bayar Kuy'
        },
        e_wallet: {
            provider: 'DANA',
            number: '081237430671',
            holder: 'Trie Str'
        }
    },
    MESSAGE_LIMITS: {
        5000: 200,
        10000: 400,
        20000: 600,
        MIN_AMOUNT_FOR_MESSAGE: 5000
    },
    ADMIN_FEE: {
        MIN: 1,
        MAX: 355
    },
    SUCCESS_MESSAGES: [
        'Semoga transaksi kamu selalu lancar, ya!',
        'Makasi banyak atas pembayaranmu!',
        'Pembayaranmu bikin semuanya lebih mudah!',
        'Transaksimu sukses, kece abis!',
        'Hari ini jadi lebih asik karena pembayaranmu!',
        'Kami super appreciate pembayaranmu!'
    ]
};

// Payment Data
const paymentData = {
    name: '',
    isAnonymous: false,
    amount: 0,
    adminFee: 0,
    totalAmount: 0,
    message: '',
    transactionId: '',
    expiredTime: null,
    checkInterval: null,
    paymentMethod: 'qris'
};

// Payment History
let paymentHistory = [];