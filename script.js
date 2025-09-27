document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("trip-form");
  const budgetForm = document.getElementById("budget-form");
  const categoryBudgetForm = document.getElementById("category-budget-form");
  const expenseForm = document.getElementById("expense-form");
  const filterBtn = document.getElementById("filter-btn");
  const pdfBtn = document.getElementById("generate-pdf-btn");

  const tripSelects = [
    document.getElementById("trip-select-budget"),
    document.getElementById("trip-select-expense"),
    document.getElementById("trip-select-summary"),
  ];

  let trips = [];

  let chart = []; // Variable para almacenar la instancia del gráfico

  tripForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTrip = {
      id: Date.now(),
      destination: document.getElementById("destination").value,
      country: document.getElementById("country").value,
      city: document.getElementById("city").value,
      startDate: document.getElementById("start-date").value,
      endDate: document.getElementById("end-date").value,
      totalBudget: 0,
      currency: "USD",
      categoryBudgets: {},
      expenses: [],
    };
    trips.push(newTrip);
    updateTripSelects();
    showSections();
    tripForm.reset();
  });

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const tripId = parseInt(
      document.getElementById("trip-select-budget").value
    );
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      trip.totalBudget = parseFloat(
        document.getElementById("total-budget").value
      );
      trip.currency = document.getElementById("currency").value;
      document.getElementById("category-budget-section").style.display =
        "block";
      updateSummary(tripId);
    }
  });

  categoryBudgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const tripId = parseInt(
      document.getElementById("trip-select-budget").value
    );
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      const category = document.getElementById("category-select").value;
      const amount = parseFloat(
        document.getElementById("category-budget").value
      );
      const totalCategoryBudget = Object.values(trip.categoryBudgets).reduce(
        (sum, val) => sum + val,
        0
      );
      console.log(totalCategoryBudget, amount, trip.totalBudget);

      if (totalCategoryBudget + amount >= trip.totalBudget) {
        alert(
          "La suma de los presupuestos de las categorías no puede exceder el presupuesto total."
        );
      } else {
        trip.categoryBudgets[category] = amount;
        displayCategoryBudgets(trip);
        updateSummary(tripId);
      }
    }
  });

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const tripId = parseInt(
      document.getElementById("trip-select-expense").value
    );
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      const newExpense = {
        category: document.getElementById("expense-category").value,
        amount: parseFloat(document.getElementById("expense-amount").value),
        date: document.getElementById("expense-date").value,
      };
      trip.expenses.push(newExpense);
      updateSummary(tripId);
      expenseForm.reset();
      document.getElementById("trip-select-expense").value = tripId;
    }
  });

  tripSelects.forEach((select) => {
    select.addEventListener("change", (e) => {
      if (e.target.id === "trip-select-summary") {
        updateSummary(parseInt(e.target.value));
      }
    });
  });

  filterBtn.addEventListener("click", () => {
    const tripId = parseInt(
      document.getElementById("trip-select-summary").value
    );
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      const category = document.getElementById("filter-category").value;
      const startDate = document.getElementById("filter-start-date").value;
      const endDate = document.getElementById("filter-end-date").value;

      let filteredExpenses = trip.expenses;

      if (category) {
        filteredExpenses = filteredExpenses.filter(
          (expense) => expense.category === category
        );
      }
      if (startDate) {
        filteredExpenses = filteredExpenses.filter(
          (expense) => expense.date >= startDate
        );
      }
      if (endDate) {
        filteredExpenses = filteredExpenses.filter(
          (expense) => expense.date <= endDate
        );
      }

      displayFilteredExpenses(filteredExpenses, trip.currency);
    }
  });

  function updateTripSelects() {
    tripSelects.forEach((select) => {
      select.innerHTML = trips
        .map(
          (trip) => `<option value="${trip.id}">${trip.destination}</option>`
        )
        .join("");
    });
    if (trips.length > 0) {
      updateSummary(trips[0].id);
    }
  }

  function showSections() {
    if (trips.length > 0) {
      document.getElementById("budget-definition").style.display = "block";
      document.getElementById("expense-tracking").style.display = "block";
      document.getElementById("summary-analysis").style.display = "block";
    }
  }

  function displayCategoryBudgets(trip) {
    const display = document.getElementById("category-budgets-display");
    display.innerHTML =
      "<h4>Presupuesto por categoría:</h4>" +
      Object.entries(trip.categoryBudgets)
        .map(
          ([cat, amt]) => `<p>${cat}: ${amt.toFixed(2)} ${trip.currency}</p>`
        )
        .join("");
  }

  function updateSummary(tripId) {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const summaryDisplay = document.getElementById("summary-display");
    const alertsDisplay = document.getElementById("alerts-display");

    const totalExpenses = trip.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const remainingBudget = trip.totalBudget - totalExpenses;

    summaryDisplay.innerHTML = `
            <h3>${trip.destination} Resumen</h3>
            <p><strong>Presupuesto total:</strong> ${trip.totalBudget.toFixed(
              2
            )} ${trip.currency}</p>
            <p><strong>Total de gastos:</strong> ${totalExpenses.toFixed(2)} ${
      trip.currency
    }</p>
            <p><strong>Presupuesto restante:</strong> ${remainingBudget.toFixed(
              2
            )} ${trip.currency}</p>
            <canvas id="grafica"></canvas>
            <canvas id="grafica2"></canvas>
            
        `;
    const labels = trip.expenses.map((exp) => exp.category);
    const colors = [
      "rgb(69,177,223)",
      "rgb(99,201,122)",
      "rgb(203,82,82)",
      "rgb(229,224,88)",
    ];
    const infoData = trip.expenses.map((exp) => exp.amount);

    const graph = document.querySelector("#grafica");

    const data = {
      labels: labels,
      datasets: [
        {
          data: infoData,
          backgroundColor: colors,
        },
      ],
    };

    const config = {
      type: "pie",
      data: data,
    };

    new Chart(graph, config);

    // const labels2 = ["Enero", "Febrero", "Marzo", "Abril"];

    const dataset1 = {
      label: "Presupuesto Total",
      data: trip.totalBudget
        ? [
            trip.totalBudget,
            trip.totalBudget,
            trip.totalBudget,
            trip.totalBudget,
          ]
        : [0, 0, 0, 0],
      borderColor: "rgba(248, 37, 37, 0.8)",
      fill: false,
      tension: 0.1,
    };

    const dataset2 = {
      label: "Gasto Real",
      data: infoData,
      borderColor: "rgba(69, 248, 84, 0.8)",
      fill: false,
      tension: 0.1,
    };

    // gasto real vs gasto por categoria

    const graph2 = document.querySelector("#grafica2");

    const data2 = {
      labels: labels,
      datasets: [dataset1, dataset2],
    };

    const config2 = {
      type: "line",
      data: data2,
    };

    new Chart(graph2, config2);

    alertsDisplay.innerHTML = "";
    const percentageSpent = (totalExpenses / trip.totalBudget) * 100;
    console.log("estye es el presupuesto", percentageSpent);

    if (percentageSpent >= 100) {
      alertsDisplay.innerHTML += `<div class="alert red"Z>¡Alerta: Has superado tu presupuesto!</div>`;
    } else if (percentageSpent >= 80) {
      alertsDisplay.innerHTML += `<div class="alert orange">¡Alerta: Has gastado el 80% o más de tu presupuesto!</div>`;
    } else if (percentageSpent >= 50) {
      alertsDisplay.innerHTML += `<div class="alert yellow">¡Alerta: Has gastado el 50% o más de tu presupuesto!</div>`;
    }

    displayFilteredExpenses(trip.expenses, trip.currency);
    topCategories(trip.expenses);
    topDownByCategory(trip.expenses);
  }

  function displayFilteredExpenses(expenses, currency) {
    const display = document.getElementById("filtered-expenses-display");
    display.innerHTML =
      "<h4>Gastos:</h4>" +
      expenses
        .map(
          (exp) =>
            `<p>${exp.date} - ${exp.category}: ${exp.amount.toFixed(
              2
            )} ${currency}</p>`
        )
        .join("");
  }

  function topCategories(expenses) {
    const categoryTotals = {};
    expenses.forEach((exp) => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );
    const topCategories = document.getElementById("top-categories-display");
    topCategories.innerHTML =
      "<h4>Categorias principales:</h4>" +
      sortedCategories
        .map(([cat, amt]) => `<p>${cat}: ${amt.toFixed(2)}</p>`)
        .join("");
  }
  function topDownByCategory(expenses) {
    const categoryTotals = {};
    expenses.forEach((exp) => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => a[1] - b[1]
    );
    const topCategories = document.getElementById("top-categories-display2");
    topCategories.innerHTML =
      "<h4>Categorias bajas principales:</h4>" +
      sortedCategories
        .map(([cat, amt]) => `<p>${cat}: ${amt.toFixed(2)}</p>`)
        .join("");
  }
  pdfBtn.addEventListener("click", () => {
    // cantidad de dias  graficas
    const tripId = parseInt(
      document.getElementById("trip-select-summary").value
    );
    const trip = trips.find((t) => t.id === tripId);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const imgCanvas = document.querySelector("#grafica");
    const imgCanvas2 = document.querySelector("#grafica2");
    const chart1Image = imgCanvas.toDataURL("image/png", 1.0);
    const chart2Image = imgCanvas2.toDataURL("image/png", 1.0);
    doc.addImage(chart1Image, "PNG", 10, 100, 190, 100);
    doc.addImage(chart2Image, "PNG", 10, 200, 190, 100);
    doc.text("Resumen del viaje", 10, 10);

    doc.text(document.getElementById("summary-display").innerText, 10, 20);
    doc.text("Categorias principales:", 10, 25);
    doc.text(
      document.getElementById("top-categories-display").innerText,
      10,
      30
    );
    doc.text(
      document.getElementById("top-categories-display2").innerText,
      10,
      40
    );
    doc.text("Cantidad de días: " + trip.days, 10, 50);
    doc.text("Resumen de Gastos:", 10, 60);
    doc.text(
      document.getElementById("filtered-expenses-display").innerText,
      10,
      70
    );
    // doc.text("Total Gastado: " + trip.totalSpent.toFixed(2) + " " + trip.currency, 10, 80);
    // doc.text("Total Presupuesto: " + trip.totalBudget.toFixed(2) + " " + trip.currency, 10, 90);
    // doc.text("Porcentaje Gastado: " + percentageSpent.toFixed(2) + "%", 10, 100);
    // doc.text("Resumen de Gráficas:", 10, 110);
    // doc.addPage();
    // doc.text("Gráfica 1: Gastos por Categoría", 10, 10);
    // doc.addImage(chart1Image, "PNG", 10, 20, 180, 160);
    // doc.addPage();
    // doc.text("Gráfica 2: Gastos por Día", 10, 10);
    // doc.addImage(chart2Image, "PNG", 10, 20, 180, 160);
    doc.save("resumen_viaje.pdf");
  });
});
