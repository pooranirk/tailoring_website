/* ===================================================================
   PRIYA STITCHIQUE - VUE.JS APPLICATION LOGIC
   Client Order & Outfit Management with LocalStorage Persistence
   =================================================================== */

const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // Outfit Types specified by user: chudi, ari work blouse, blouse, lehanga
    const outfitTypes = [
      'Chudi',
      'Aari Work Blouse',
      'Blouse',
      'Lehenga'
    ];

    // Outfit category details (for the visual cards without photos)
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

    // Initial mock data if localStorage is empty
    const defaultOrders = [
      {
        id: 1,
        clientName: 'Priya Ananth',
        outfitType: 'Aari Work Blouse',
        paymentStatus: 'Paid',
        phone: '98401 23456',
        amount: 2800,
        deliveryDate: '2026-10-25',
        notes: 'Peacock neck pattern with antique gold zardosi for wedding reception',
        createdAt: '2026-10-18'
      },
      {
        id: 2,
        clientName: 'Kavitha Sundar',
        outfitType: 'Chudi',
        paymentStatus: 'Unpaid',
        phone: '98412 87654',
        amount: 850,
        deliveryDate: '2026-10-23',
        notes: 'Chudidhar bottom with rope piping & pocket addition',
        createdAt: '2026-10-19'
      },
      {
        id: 3,
        clientName: 'Deepa Ramesh',
        outfitType: 'Lehenga',
        paymentStatus: 'Unpaid',
        phone: '94443 11223',
        amount: 3500,
        deliveryDate: '2026-10-28',
        notes: 'Double can-can flare + high waist lehenga with sweetheart blouse',
        createdAt: '2026-10-19'
      },
      {
        id: 4,
        clientName: 'Meena Suresh',
        outfitType: 'Blouse',
        paymentStatus: 'Paid',
        phone: '97890 55443',
        amount: 550,
        deliveryDate: '2026-10-22',
        notes: 'Princess cut blouse with gold piping and potli buttons',
        createdAt: '2026-10-17'
      },
      {
        id: 5,
        clientName: 'Soundarya Vijay',
        outfitType: 'Aari Work Blouse',
        paymentStatus: 'Unpaid',
        phone: '98840 99887',
        amount: 2400,
        deliveryDate: '2026-10-26',
        notes: 'Bridal mango motif with pearl bead border work',
        createdAt: '2026-10-20'
      }
    ];

    // Reactive State
    const orders = ref([]);
    const searchQuery = ref('');
    const selectedType = ref('All');
    const selectedPaymentStatus = ref('All');
    const viewMode = ref('grid'); // 'grid' or 'table'
    const isDarkMode = ref(true);

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
      notes: ''
    });

    // Load from LocalStorage
    onMounted(() => {
      const savedOrders = localStorage.getItem('priya_stitchique_orders');
      if (savedOrders) {
        try {
          orders.value = JSON.parse(savedOrders);
        } catch (e) {
          orders.value = defaultOrders;
        }
      } else {
        orders.value = defaultOrders;
      }

      const savedTheme = localStorage.getItem('priya_stitchique_theme');
      if (savedTheme === 'light') {
        isDarkMode.value = false;
        document.body.classList.add('theme-light');
      }
    });

    // Save to LocalStorage whenever orders change
    watch(
      orders,
      (newOrders) => {
        localStorage.setItem('priya_stitchique_orders', JSON.stringify(newOrders));
      },
      { deep: true }
    );

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
        // Search matches client name or phone
        const query = searchQuery.value.trim().toLowerCase();
        const matchesSearch =
          !query ||
          order.clientName.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query);

        // Filter by Outfit Type
        const matchesType =
          selectedType.value === 'All' || order.outfitType === selectedType.value;

        // Filter by Payment Status (Paid / Unpaid)
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

    // Toggle Paid / Unpaid Status directly from card/table
    const togglePaymentStatus = (order) => {
      order.paymentStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    };

    // Modal Control
    const openAddModal = (presetType = null) => {
      isEditing.value = false;
      formErrors.value = {};
      const today = new Date().toISOString().split('T')[0];
      
      // Default delivery date 5 days from today
      const defaultDelivery = new Date();
      defaultDelivery.setDate(defaultDelivery.getDate() + 5);

      currentForm.value = {
        id: Date.now(),
        clientName: '',
        outfitType: presetType || 'Chudi',
        paymentStatus: 'Unpaid',
        phone: '',
        amount: '',
        deliveryDate: defaultDelivery.toISOString().split('T')[0],
        notes: '',
        createdAt: today
      };
      isModalOpen.value = true;
    };

    const openEditModal = (order) => {
      isEditing.value = true;
      formErrors.value = {};
      currentForm.value = { ...order };
      isModalOpen.value = true;
    };

    const closeModal = () => {
      isModalOpen.value = false;
    };

    // Validate and Save Order
    const saveOrder = () => {
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

      if (isEditing.value) {
        const index = orders.value.findIndex((o) => o.id === currentForm.value.id);
        if (index !== -1) {
          orders.value[index] = { ...currentForm.value };
        }
      } else {
        orders.value.unshift({ ...currentForm.value });
      }

      closeModal();
    };

    // Delete Order
    const deleteOrder = (id) => {
      if (confirm('Are you sure you want to delete this client order?')) {
        orders.value = orders.value.filter((o) => o.id !== id);
      }
    };

    // Format Currency
    const formatCurrency = (val) => {
      if (!val && val !== 0) return '₹0';
      return '₹' + Number(val).toLocaleString('en-IN');
    };

    // WhatsApp Message Generator
    const getWhatsAppLink = (order) => {
      // Clean phone number (keep only digits)
      let cleanPhone = order.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone; // add India country code if 10 digits
      }
      
      const message = `Vanakkam ${order.clientName} ji! ✨\nThis is Priya Stitchique regarding your ${order.outfitType} order.\n\nStatus: ${order.paymentStatus === 'Paid' ? 'Paid & Confirmed ✅' : 'Payment Due: ' + formatCurrency(order.amount) + ' ⏳'}\nDelivery Date: ${order.deliveryDate || 'Scheduled soon'}\n\nThank you for choosing Priya Stitchique! 🌸`;
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
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
      toggleTheme,
      stats,
      getOutfitTypeCount,
      selectTypeFilter,
      togglePaymentStatus,
      isModalOpen,
      isEditing,
      currentForm,
      formErrors,
      openAddModal,
      openEditModal,
      closeModal,
      saveOrder,
      deleteOrder,
      formatCurrency,
      getWhatsAppLink
    };
  }
}).mount('#app');
