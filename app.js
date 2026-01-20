// === МОДЕЛИ ДАННЫХ ===
class Shift {
  constructor() {
    this.id = this.generateId();
    this.startDateTime = new Date().toISOString();
    this.endDateTime = null;
    this.status = 'active';
    this.orders = [];
    this.expenses = [];
    this.totals = {
      totalKm: 0,
      totalTimeHours: 0,
      fuelLiters: 0,
      fuelCost: 0,
      webastoLiters: 0,
      grossIncome: 0,
      amortization: 0,
      tax: 0,
      netIncome: 0,
      margin: 0
    };
  }

  generateId() {
    const d = new Date();
    return `shift_${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}_${String(d.getDate()).padStart(2, '0')}_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  }
}

class Order {
  constructor() {
    this.id = this.generateId();
    this.type = '5+1';
    this.status = 'active';
    this.startDateTime = null;
    this.endDateTime = null;

    this.route = {
      kmToBase: 0,
      mainRouteKm: 0,
      homeKm: 0,
      totalKm: 0
    };

    this.time = {
      baseHours: 0,
      extraMinutes: 0,
      extraHoursRounded: 0,
      totalHours: 0
    };

    this.tariff = {
      type: '',
      baseRate: 0,
      extraHourRate: 0
    };

    this.options = {
      refrigerator: false,
      webasto: false
    };

    this.finance = {
      grossIncome: 0,
      fuelCost: 0,
      webastoCost: 0,
      amortization: 0,
      tax: 0,
      netIncome: 0,
      margin: 0
    };

    this.documents = {
      photos: [],
      sentToDispatcher: false
    };

    this.payment = {
      paid: false,
      paidDate: null
    };
  }

  generateId() {
    return `order_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  }
}

class Expense {
  constructor(type, liters, pricePerLiter) {
    this.id = this.generateId();
    this.type = type;
    this.dateTime = new Date().toISOString();

    this.data = {
      liters: liters,
      pricePerLiter: pricePerLiter,
      totalCost: liters * pricePerLiter
    };

    this.linkedOrderId = null;
  }

  generateId() {
    return `expense_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  }
}

// === ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===
const AppState = {
  activeShift: null,
  shiftsHistory: [],
  settings: {
    fuelConsumption: 12,
    webastoConsumptionPerHour: 0.5,
    refrigeratorMultiplier: 1.18,
    amortizationPercent: 20,
    taxPercent: 6,
    defaultRates: {
      km: [60, 65, 70, 75, 80],
      hour: 1000
    }
  },
  calculatorState: {
    input: {
      km: 0,
      estimatedHours: 0,
      pointsCount: 0,
      isLO: false,
      refrigerator: false,
      webasto: false
    },
    rates: {
      perKm: [60, 65, 70, 75, 80],
      hourRate: 1000
    },
    result: {
      recommendedRate: 0,
      grossIncome: 0,
      fuelCost: 0,
      netIncome: 0,
      comment: ''
    }
  }
};
// === ОСНОВНОЙ КЛАСС ПРИЛОЖЕНИЯ ===
class App {
  constructor() {
    this.state = AppState;
    this.init();
  }

  init() {
    this.loadState();
    this.bindEvents();
    this.renderMainScreen();
  }

  loadState() {
    const saved = localStorage.getItem('appState');
    if (saved) {
      this.state = JSON.parse(saved);
      if (this.state.activeShift) {
        Object.setPrototypeOf(this.state.activeShift, Shift.prototype);
      }
    }
  }

  saveState() {
    localStorage.setItem('appState', JSON.stringify(this.state));
  }

  bindEvents() {
    document.getElementById('start-shift').addEventListener('click', this.startShift.bind(this));
    document.getElementById('close-shift').addEventListener('click', this.closeShift.bind(this));
    document.getElementById('open-reports').addEventListener('click', this.openReports.bind(this));
    document.getElementById('back-to-main').addEventListener('click', () => this.showScreen('main-screen'));
    document.getElementById('open-calculator').addEventListener('click', this.openCalculator.bind(this));
    document.getElementById('close-calculator').addEventListener('click', this.closeCalculator.bind(this));
    document.getElementById('calculate').addEventListener('click', this.calculate.bind(this));

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        this.showTab(tabName);
      });
    });

    document.getElementById('add-order').addEventListener('click', this.addOrder.bind(this));
    document.getElementById('add-expense').addEventListener('click', this.addExpense.bind(this));
  }

  renderMainScreen() {
    const shiftBtn = document.getElementById('start-shift');
    shiftBtn.disabled = !!this.state.activeShift;
  }

  startShift() {
    this.state.activeShift = new Shift();
    this.saveState();
    this.showScreen('shift-container');
    this.updateShiftTab();
  }

  closeShift() {
    if (this.state.activeShift.orders.some(o => o.status !== 'completed')) {
      alert('Нельзя закрыть смену с активными заказами!');
      return;
    }
    this.state.activeShift.endDateTime = new Date().toISOString();
    this.state.activeShift.status = 'closed';
    this.state.shiftsHistory.push(this.state.activeShift);
    this.state.activeShift = null;
    this.saveState();
    this.showScreen('main-screen');
  }

  openReports() {
    this.showScreen('reports-container');
  }

  openCalculator() {
    document.getElementById('calculator-modal').style.display = 'flex';
  }

  closeCalculator() {
    document.getElementById('calculator-modal').style.display = 'none';
  }

  calculate() {
    const form = document.getElementById('calculator-form');
    const data = new FormData(form);

    const km = parseFloat(data.get('km')) || 0;
    const hours = parseFloat(data.get('estimatedHours')) || 0;
    const points = parseInt(data.get('pointsCount')) || 0
