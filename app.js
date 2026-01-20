// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker зарегистрирован'))
    .catch(err => console.error('Ошибка SW:', err));
}

// Обработчик формы расчёта
document.getElementById('calcForm').addEventListener('submit', (e) => {
  e.preventDefault();

  // Собираем данные
  const distanceInput = document.getElementById('distance');
  const timeInput = document.getElementById('time');

  const distance = parseFloat(distanceInput.value);
  const time = parseFloat(timeInput.value);

  const isCity = document.getElementById('city').checked;
  const isRegion = document.getElementById('region').checked;
  const hasRefrigerator = document.getElementById('refrigerator').checked;
  const hasWebasto = document.getElementById('webasto').checked;
  const cargoType = document.getElementById('cargoType').value;
  const prr = document.getElementById('prr').checked;

  // Проверка ввода
  if (isNaN(distance) || distance <= 0) {
    alert('Укажите корректный километраж');
    return;
  }
  if (isNaN(time) || time <= 0) {
    alert('Укажите корректное время в пути');
    return;
  }

  // Расчёт тарифов
  const baseRate = 70; // ₽ за км
  let totalCost = distance * baseRate;

  // Надбавки
  if (hasRefrigerator) totalCost *= 1.1; // +10%
  if (hasWebasto) totalCost *= 1.05; // +5%
  if (!prr) totalCost += 2000; // ПРР не включён

  // Маржа (упрощённая формула)
  const margin = ((totalCost - (distance * 40)) / totalCost) * 100;

  // Определение уровня маржи
  let marginColor = 'green';
  if (margin < 10) marginColor = 'red';
  else if (margin < 20) marginColor = 'yellow';

  // Риски (примерные)
  const risksList = [];
  if (isCity) risksList.push('Пробки в городе (+500 ₽)');
  if (cargoType === 'хрупкий') risksList.push('Риск повреждения груза (+1000 ₽)');
  if (cargoType === 'опасный') risksList.push('Особые требования к перевозке (+1500 ₽)');

  // Советы
  const adviceList = [];
  if (!prr) adviceList.push('Уточните у клиента, кто выполняет ПРР.');
  if (hasRefrigerator) adviceList.push('Проверьте работу рефрижератора перед выездом.');
  if (isCity && time > 5) adviceList.push('Планируйте маршрут с учётом пробок.');

  // Отображение результатов
  const results = document.getElementById('results');
  const tariffCards = document.getElementById('tariffCards');
  const risks = document.getElementById('risks');
  const advice = document.getElementById('advice');

  results.style.display = 'block';

  // Карточка тарифа
  tariffCards.innerHTML = `
    <div class="tariff-card">
      <div class="tariff-title">За км</div>
      <div class="tariff-cost">${Math.round(totalCost)} ₽</div>
      <div class="tariff-margin" style="color: ${
        marginColor === 'red' ? 'var(--danger)' :
        marginColor === 'yellow' ? 'var(--warning)' : 'var(--primary)'
      }">
        Маржа: ${margin.toFixed(1)}%
      </div>
    </div>
  `;

  // Риски
  if (risksList.length > 0) {
    risks.innerHTML = `<strong>Риски:</strong><br>` + risksList.join('<br>');
  } else {
    risks.style.display = 'none';
  }

  // Советы
  if (adviceList.length > 0) {
    advice.innerHTML = `<strong>Рекомендации:</strong><br>` + adviceList.join('<br>');
  } else {
    advice.style.display = 'none';
  }
});
