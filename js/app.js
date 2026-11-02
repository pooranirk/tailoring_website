/* ===================================================================
   PRIYA STITCHIQUE - VUE.JS APPLICATION LOGIC
   Client Order & Outfit Management with Firebase Firestore & Measurements
   =================================================================== */

// Firebase Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyC_jTEk8KEW77b1QsSmV5kJt_5CBZMYxwM",
  authDomain: "priya-stitchique.firebaseapp.com",
  projectId: "priya-stitchique",
  storageBucket: "priya-stitchique.firebasestorage.app",
  messagingSenderId: "1065955980404",
  appId: "1:1065955980404:web:dbc1bd0399495749d64d21"
};

// Initialize Firebase App & Firestore
let db = null;
let firebaseInitialized = false;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    firebaseInitialized = true;
  }
} catch (e) {
  console.warn('Firebase Initialization Notice:', e);
}

const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // Outfit Types
    const outfitTypes = [
      'Chudi',
      'Aari Work Blouse',
      'Blouse',
      'Lehenga'
    ];

    // Outfit category details
    const outfitCategories = [
      {
        name: 'Chudi',
        description: 'Chudidhar, Punjabi Suits, Salwar Kameez, Anarkali custom tailoring & lining.',
        icon: 'needle',
        priceRange: 'From ₹650'
      },
      {
        name: 'Aari Work Blouse',
        description: 'Bridal handcrafted Maggam & Aari embroidery, zardosi, stone & bead artistry.',
        icon: 'gem',
        priceRange: 'From ₹1,800'
      },
      {
        name: 'Blouse',
        description: 'Designer princess cut, boat neck, back dori knot, katori & padded pattern blouse.',
        icon: 'cut',
        priceRange: 'From ₹450'
      },
      {
        name: 'Lehenga',
        description: 'Bridal flared lehenga, crop top, can-can lining & customized dupatta styling.',
        icon: 'sparkle',
        priceRange: 'From ₹2,200'
      }
    ];

    // Default empty measurements helper
    const getEmptyMeasurements = () => ({
      chest: '',
      waist: '',
      hip: '',
      length: '',
      shoulder: '',
      sleeveLength: '',
      sleeveRound: '',
      armhole: '',
      frontNeck: '',
      backNeck: '',
      bottomLength: ''
    });

    // Reactive State
    const orders = ref([]);
    const searchQuery = ref('');
    const selectedType = ref('All');
    const selectedPaymentStatus = ref('All');
    const viewMode = ref('grid'); // 'grid' or 'table'
    const isDarkMode = ref(true);
    const isLoading = ref(true);
    const isSaving = ref(false);

    // Firebase Connection Status
    const firebaseStatus = ref(firebaseInitialized ? 'connecting' : 'offline');
    const firebaseStatusText = ref(firebaseInitialized ? 'Connecting Cloud...' : 'Local Mode');
    const firebaseError = ref('');

    // Modal & Form State
    const isModalOpen = ref(false);
    const isEditing = ref(false);
    const formErrors = ref({});
    const currentForm = ref({
      id: null,
      clientName: '',
      outfitType: 'Chudi',
      paymentStatus: 'Unpaid',
      phone: '',
      amount: '',
      deliveryDate: '',
      notes: '',
      measurements: getEmptyMeasurements()
    });

    // Measurement Viewer Modal State
    const isMeasurementModalOpen = ref(false);
    const activeMeasurementOrder = ref(null);

    // Load from LocalStorage fallback
    const loadFromLocalStorage = () => {
      const savedOrders = localStorage.getItem('priya_stitchique_orders');
      if (savedOrders) {
        try {
          orders.value = JSON.parse(savedOrders);
        } catch (e) {
          orders.value = [];
        }
      } else {
        orders.value = [];
      }
      isLoading.value = false;
    };

    // Save orders to LocalStorage as secondary offline backup
    const backupToLocalStorage = (data) => {
      try {
        localStorage.setItem('priya_stitchique_orders', JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage backup error:', e);
      }
    };

    // Initialize Data & Firestore Real-Time Listener
    onMounted(() => {
      // Theme
      const savedTheme = localStorage.getItem('priya_stitchique_theme');
      if (savedTheme === 'light') {
        isDarkMode.value = false;
        document.body.classList.add('theme-light');
      }

      if (db) {
        firebaseStatus.value = 'connecting';
        firebaseStatusText.value = 'Connecting Cloud...';

        try {
          // Listen to 'orders' collection in real-time
          db.collection('orders').onSnapshot(
            (snapshot) => {
              const loadedOrders = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                loadedOrders.push({
                  id: doc.id,
                  clientName: data.clientName || 'Unnamed Client',
                  outfitType: data.outfitType || 'Chudi',
                  paymentStatus: data.paymentStatus || 'Unpaid',
                  phone: data.phone || '',
                  amount: Number(data.amount) || 0,
                  deliveryDate: data.deliveryDate || '',
                  notes: data.notes || '',
                  measurements: data.measurements || getEmptyMeasurements(),
                  createdAt: data.createdAt || ''
                });
              });

              // Sort by createdAt descending
              loadedOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

              orders.value = loadedOrders;
              backupToLocalStorage(loadedOrders);
              isLoading.value = false;
              firebaseStatus.value = 'connected';
              firebaseStatusText.value = 'Cloud Sync Live';
              firebaseError.value = '';
            },
            (err) => {
              console.error('Firestore listener error:', err);
              firebaseStatus.value = 'error';
              firebaseStatusText.value = 'Database Setup Required';
              firebaseError.value = err.message;
              loadFromLocalStorage();
            }
          );
        } catch (err) {
          console.error('Firebase setup failed:', err);
          firebaseStatus.value = 'offline';
          firebaseStatusText.value = 'Local Mode';
          loadFromLocalStorage();
        }
      } else {
        firebaseStatus.value = 'offline';
        firebaseStatusText.value = 'Local Mode';
        loadFromLocalStorage();
      }
    });

    // Theme Toggle
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      if (isDarkMode.value) {
        document.body.classList.remove('theme-light');
        localStorage.setItem('priya_stitchique_theme', 'dark');
      } else {
        document.body.classList.add('theme-light');
        localStorage.setItem('priya_stitchique_theme', 'light');
      }
    };

    // Filtered and Searched Orders
    const filteredOrders = computed(() => {
      return orders.value.filter((order) => {
        const query = searchQuery.value.trim().toLowerCase();
        const matchesSearch =
          !query ||
          (order.clientName && order.clientName.toLowerCase().includes(query)) ||
          (order.phone && order.phone.toLowerCase().includes(query));

        const matchesType =
          selectedType.value === 'All' || order.outfitType === selectedType.value;

        const matchesStatus =
          selectedPaymentStatus.value === 'All' ||
          order.paymentStatus === selectedPaymentStatus.value;

        return matchesSearch && matchesType && matchesStatus;
      });
    });

    // Overview Statistics
    const stats = computed(() => {
      const total = orders.value.length;
      const paid = orders.value.filter((o) => o.paymentStatus === 'Paid').length;
      const unpaid = orders.value.filter((o) => o.paymentStatus === 'Unpaid').length;
      
      const unpaidDue = orders.value
        .filter((o) => o.paymentStatus === 'Unpaid')
        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

      const totalRevenue = orders.value
        .filter((o) => o.paymentStatus === 'Paid')
        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

      return {
        total,
        paid,
        unpaid,
        unpaidDue,
        totalRevenue
      };
    });

    // Count per outfit type
    const getOutfitTypeCount = (type) => {
      return orders.value.filter((o) => o.outfitType === type).length;
    };

    // Quick filter click on outfit card
    const selectTypeFilter = (type) => {
      if (selectedType.value === type) {
        selectedType.value = 'All';
      } else {
        selectedType.value = type;
      }
    };

    // Check if an order has any measurement entered
    const hasMeasurements = (order) => {
      if (!order || !order.measurements) return false;
      return Object.values(order.measurements).some((val) => val && String(val).trim() !== '');
    };

    // Toggle Payment Status (Paid / Unpaid) directly from card/table
    const togglePaymentStatus = async (order) => {
      const nextStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
      order.paymentStatus = nextStatus;

      if (db && order.id && !String(order.id).startsWith('local_')) {
        try {
          await db.collection('orders').doc(String(order.id)).update({
            paymentStatus: nextStatus
          });
        } catch (e) {
          console.warn('Firestore status update error:', e);
        }
      }
      backupToLocalStorage(orders.value);
    };

    // Modal Control: Add New Order
    const openAddModal = (presetType = null) => {
      isEditing.value = false;
      formErrors.value = {};
      const today = new Date().toISOString().split('T')[0];
      
      const defaultDelivery = new Date();
      defaultDelivery.setDate(defaultDelivery.getDate() + 5);

      currentForm.value = {
        id: null,
        clientName: '',
        outfitType: presetType || 'Chudi',
        paymentStatus: 'Unpaid',
        phone: '',
        amount: '',
        deliveryDate: defaultDelivery.toISOString().split('T')[0],
        notes: '',
        measurements: getEmptyMeasurements(),
        createdAt: today
      };
      isModalOpen.value = true;
    };

    // Modal Control: Edit Order
    const openEditModal = (order) => {
      isEditing.value = true;
      formErrors.value = {};
      currentForm.value = {
        ...order,
        measurements: {
          ...getEmptyMeasurements(),
          ...(order.measurements || {})
        }
      };
      isModalOpen.value = true;
    };

    const closeModal = () => {
      isModalOpen.value = false;
    };

    // Measurement Viewer Modal
    const openMeasurementModal = (order) => {
      activeMeasurementOrder.value = order;
      isMeasurementModalOpen.value = true;
    };

    const closeMeasurementModal = () => {
      isMeasurementModalOpen.value = false;
      activeMeasurementOrder.value = null;
    };

    // Save Order (Create or Update in Firebase / LocalStorage)
    const saveOrder = async () => {
      formErrors.value = {};

      if (!currentForm.value.clientName.trim()) {
        formErrors.value.clientName = 'Client Name is required';
      }
      if (!currentForm.value.phone.trim()) {
        formErrors.value.phone = 'Contact number is required';
      }

      if (Object.keys(formErrors.value).length > 0) {
        return;
      }

      isSaving.value = true;

      const orderData = {
        clientName: currentForm.value.clientName.trim(),
        outfitType: currentForm.value.outfitType,
        paymentStatus: currentForm.value.paymentStatus,
        phone: currentForm.value.phone.trim(),
        amount: Number(currentForm.value.amount) || 0,
        deliveryDate: currentForm.value.deliveryDate || '',
        notes: (currentForm.value.notes || '').trim(),
        measurements: { ...currentForm.value.measurements }
      };

      try {
        if (db) {
          if (isEditing.value && currentForm.value.id && !String(currentForm.value.id).startsWith('local_')) {
            await db.collection('orders').doc(String(currentForm.value.id)).update({
              ...orderData,
              updatedAt: new Date().toISOString()
            });
          } else {
            const today = new Date().toISOString().split('T')[0];
            await db.collection('orders').add({
              ...orderData,
              createdAt: currentForm.value.createdAt || today,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        } else {
          // Local fallback
          if (isEditing.value) {
            const idx = orders.value.findIndex((o) => o.id === currentForm.value.id);
            if (idx !== -1) {
              orders.value[idx] = { ...orders.value[idx], ...orderData };
            }
          } else {
            const newOrder = {
              id: 'local_' + Date.now(),
              ...orderData,
              createdAt: currentForm.value.createdAt || new Date().toISOString().split('T')[0]
            };
            orders.value.unshift(newOrder);
          }
          backupToLocalStorage(orders.value);
        }

        closeModal();
      } catch (err) {
        console.error('Error saving order:', err);
        alert('Could not save to Firebase: ' + err.message + '\nSaving locally to your browser.');
        
        // Save locally as safety net
        if (isEditing.value) {
          const idx = orders.value.findIndex((o) => o.id === currentForm.value.id);
          if (idx !== -1) orders.value[idx] = { ...currentForm.value };
        } else {
          orders.value.unshift({ id: 'local_' + Date.now(), ...orderData, createdAt: new Date().toISOString().split('T')[0] });
        }
        backupToLocalStorage(orders.value);
        closeModal();
      } finally {
        isSaving.value = false;
      }
    };

    // Delete Order
    const deleteOrder = async (id) => {
      if (confirm('Are you sure you want to delete this client order?')) {
        try {
          if (db && id && !String(id).startsWith('local_')) {
            await db.collection('orders').doc(String(id)).delete();
          } else {
            orders.value = orders.value.filter((o) => o.id !== id);
            backupToLocalStorage(orders.value);
          }
        } catch (err) {
          console.error('Error deleting order:', err);
          orders.value = orders.value.filter((o) => o.id !== id);
          backupToLocalStorage(orders.value);
        }
      }
    };

    // Format Currency
    const formatCurrency = (val) => {
      if (!val && val !== 0) return '₹0';
      return '₹' + Number(val).toLocaleString('en-IN');
    };

    // WhatsApp Message Generator with Measurements
    const getWhatsAppLink = (order) => {
      let cleanPhone = order.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      
      let measureText = '';
      if (order.measurements) {
        const m = order.measurements;
        const parts = [];
        if (m.chest) parts.push(`Chest: ${m.chest}"`);
        if (m.waist) parts.push(`Waist: ${m.waist}"`);
        if (m.length) parts.push(`Length: ${m.length}"`);
        if (m.shoulder) parts.push(`Shoulder: ${m.shoulder}"`);
        if (m.sleeveLength) parts.push(`Sleeve: ${m.sleeveLength}"`);
        if (m.frontNeck) parts.push(`Front Neck: ${m.frontNeck}"`);
        if (m.backNeck) parts.push(`Back Neck: ${m.backNeck}"`);
        if (m.bottomLength) parts.push(`Bottom: ${m.bottomLength}"`);
        if (parts.length > 0) {
          measureText = `\n\n📐 Measurements on File:\n${parts.join(', ')}`;
        }
      }

      const designNote = order.notes ? `\nDesign Notes: ${order.notes}` : '';

      const message = `Vanakkam ${order.clientName} ji! ✨\nThis is Priya Stitchique regarding your ${order.outfitType} order.\n\nStatus: ${order.paymentStatus === 'Paid' ? 'Paid & Confirmed ✅' : 'Payment Due: ' + formatCurrency(order.amount) + ' ⏳'}\nExpected Delivery: ${order.deliveryDate || 'Scheduled soon'}${measureText}${designNote}\n\nThank you for choosing Priya Stitchique! 🌸`;

      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    };

    // Print Job Sheet
    const printJobSheet = () => {
      window.print();
    };

    return {
      outfitTypes,
      outfitCategories,
      orders,
      filteredOrders,
      searchQuery,
      selectedType,
      selectedPaymentStatus,
      viewMode,
      isDarkMode,
      isLoading,
      isSaving,
      firebaseStatus,
      firebaseStatusText,
      firebaseError,
      toggleTheme,
      stats,
      getOutfitTypeCount,
      selectTypeFilter,
      hasMeasurements,
      togglePaymentStatus,
      isModalOpen,
      isEditing,
      currentForm,
      formErrors,
      isMeasurementModalOpen,
      activeMeasurementOrder,
      openAddModal,
      openEditModal,
      closeModal,
      openMeasurementModal,
      closeMeasurementModal,
      saveOrder,
      deleteOrder,
      formatCurrency,
      getWhatsAppLink,
      printJobSheet
    };
  }
}).mount('#app');
