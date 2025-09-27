document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("trip-form");
  const budgetForm = document.getElementById("budget-form");
  const categoryBudgetForm = document.getElementById("category-budget-form");
  const expenseForm = document.getElementById("expense-form");
  const filterBtn = document.getElementById("filter-btn");

  const tripSelects = [
    document.getElementById("trip-select-budget"),
    document.getElementById("trip-select-expense"),
    document.getElementById("trip-select-summary"),
  ];

  let trips = [];

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

      if (totalCategoryBudget + amount > trip.totalBudget) {
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
        `;

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
});
