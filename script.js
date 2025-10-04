document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const tripForm = document.getElementById("trip-form");
  const budgetForm = document.getElementById("budget-form");
  const categoryBudgetForm = document.getElementById("category-budget-form");
  const expenseForm = document.getElementById("expense-form");
  const filterBtn = document.getElementById("filter-btn");
  const generateReportBtn = document.getElementById("generate-report-btn");
  const emailReportBtn = document.getElementById("email-report-btn");

  const tripSelects = [
    document.getElementById("trip-select-budget"),
    document.getElementById("trip-select-expense"),
    document.getElementById("trip-select-summary"),
  ];

  // Almacenamiento de datos
  let trips = [];
  // Variables para las instancias de los gráficos
  let budgetVsActualChart = null;
  let categorySpendingChart = null;

  // --- MANEJADORES DE EVENTOS ---

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
    const trip = findTripById(tripId);
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
    const trip = findTripById(tripId);
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
          "La suma de los presupuestos por categoría no puede exceder el presupuesto total."
        );
      } else {
        trip.categoryBudgets[category] =
          (trip.categoryBudgets[category] || 0) + amount;
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
    const trip = findTripById(tripId);
    if (trip) {
      const newExpense = {
        description: document.getElementById("expense-description").value,
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

  document
    .getElementById("trip-select-summary")
    .addEventListener("change", (e) => {
      updateSummary(parseInt(e.target.value));
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

  generateReportBtn.addEventListener("click", generatePDFReport);
  //   emailReportBtn.addEventListener("click", emailReport);

  // --- FUNCIONES PRINCIPALES ---

  function updateSummary(tripId) {
    const trip = findTripById(tripId);
    if (!trip) return;

    const summaryDisplay = document.getElementById("summary-display");
    const alertsDisplay = document.getElementById("alerts-display");
    const totalExpenses = trip.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const remainingBudget = trip.totalBudget - totalExpenses;
    const percentageSpent =
      trip.totalBudget > 0 ? (totalExpenses / trip.totalBudget) * 100 : 0;

    summaryDisplay.innerHTML = `
            <h3>Resumen para ${trip.destination}</h3>
            <p><strong>Presupuesto Total:</strong> ${trip.totalBudget.toFixed(
              2
            )} ${trip.currency}</p>
            <p><strong>Gastos Totales:</strong> ${totalExpenses.toFixed(2)} ${
      trip.currency
    }</p>
            <p><strong>Presupuesto Restante:</strong> <strong style="color: ${
              remainingBudget < 0 ? "red" : "green"
            }">${remainingBudget.toFixed(2)} ${trip.currency}</strong></p>
            <p><strong>Porcentaje del Presupuesto Consumido:</strong> ${percentageSpent.toFixed(
              2
            )}%</p> `;

    // Alertas
    alertsDisplay.innerHTML = "";
    if (percentageSpent >= 100) {
      alertsDisplay.innerHTML += `<div class="alert red">¡ALERTA: Has excedido tu presupuesto!</div>`;
    } else if (percentageSpent >= 80) {
      alertsDisplay.innerHTML += `<div class="alert orange">AVISO: Has gastado el 80% o más de tu presupuesto.</div>`;
    } else if (percentageSpent >= 50) {
      alertsDisplay.innerHTML += `<div class="alert yellow">INFO: Has gastado el 50% o más de tu presupuesto.</div>`;
    }

    // --- Actualizaciones Sprint 2 ---
    renderCharts(trip); // HU8
    displayDailySummary(trip); // HU9
    displayTopExpenses(trip); // HU10, HU11
    displaySavingsScenario(trip); // HU13
  }

  // --- NUEVAS FUNCIONES (SPRINT 2) ---

  function renderCharts(trip) {
    // Destruir gráficos anteriores para evitar solapamiento
    if (budgetVsActualChart) budgetVsActualChart.destroy();
    if (categorySpendingChart) categorySpendingChart.destroy();

    const ctxBar = document
      .getElementById("budget-vs-actual-chart")
      .getContext("2d");
    const ctxDoughnut = document
      .getElementById("category-spending-chart")
      .getContext("2d");

    const categories = Object.keys(trip.categoryBudgets);
    const budgetedAmounts = Object.values(trip.categoryBudgets);
    const actualSpending = categories.map((cat) =>
      trip.expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0)
    );

    // Gráfico de Barras: Presupuesto vs Gasto Real
    budgetVsActualChart = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Presupuestado",
            data: budgetedAmounts,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "Gasto Real",
            data: actualSpending,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
    });

    // Gráfico de Dona: Distribución de Gastos
    categorySpendingChart = new Chart(ctxDoughnut, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Distribución de Gastos",
            data: actualSpending,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
          },
        ],
      },
    });
  }

  function displayDailySummary(trip) {
    const dailySummaryDiv = document.getElementById("daily-summary-display");
    const dailyTotals = trip.expenses.reduce((acc, expense) => {
      acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
      return acc;
    }, {});

    let html = "<h4>Resumen de Gastos por Día</h4>";
    if (Object.keys(dailyTotals).length === 0) {
      html += "<p>Aún no hay gastos registrados.</p>";
    } else {
      for (const [date, total] of Object.entries(dailyTotals).sort()) {
        html += `<p><strong>${date}:</strong> ${total.toFixed(2)} ${
          trip.currency
        }</p>`;
      }
    }
    dailySummaryDiv.innerHTML = html;
  }

  function displayTopExpenses(trip) {
    const topExpensesDiv = document.getElementById("top-expenses-display");
    if (trip.expenses.length === 0) {
      topExpensesDiv.innerHTML =
        "<h4>Top Gastos</h4><p>Sin gastos para analizar.</p>";
      return;
    }

    const sortedExpenses = [...trip.expenses].sort(
      (a, b) => b.amount - a.amount
    );
    const top3 = sortedExpenses.slice(0, 3);
    const bottom3 = sortedExpenses.slice(-3).reverse();

    let html = "<h4>Top 3 Gastos Más Altos y Más Bajos</h4>";
    html += "<p><strong>Más Altos:</strong></p><ul>";
    top3.forEach((exp) => {
      html += `<li>${exp.description} (${exp.category}): ${exp.amount.toFixed(
        2
      )} ${trip.currency}</li>`;
    });
    html += "</ul>";

    html += "<p><strong>Más Bajos:</strong></p><ul>";
    bottom3.forEach((exp) => {
      html += `<li>${exp.description} (${exp.category}): ${exp.amount.toFixed(
        2
      )} ${trip.currency}</li>`;
    });
    html += "</ul>";
    topExpensesDiv.innerHTML = html;
  }

  function displaySavingsScenario(trip) {
    const savingsDiv = document.getElementById("savings-scenarios-display");
    const actualSpending = Object.keys(trip.categoryBudgets).map((cat) => ({
      category: cat,
      total: trip.expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0),
    }));

    if (
      actualSpending.length === 0 ||
      Math.max(...actualSpending.map((s) => s.total)) === 0
    ) {
      savingsDiv.innerHTML =
        "<h4>Escenario de Ahorro</h4><p>No hay suficientes datos para generar una sugerencia.</p>";
      return;
    }

    const highestSpending = actualSpending.sort((a, b) => b.total - a.total)[0];
    const potentialSaving = highestSpending.total * 0.1;
    // sacar porcentaje de ahorro si se reduce en x%
    const savingPercentage = (potentialSaving / highestSpending.total) * 100;

    savingsDiv.innerHTML = `<h4>Escenario de Ahorro</h4>
            <p>Tu mayor gasto está en <strong>${
              highestSpending.category
            }</strong>.<br> Si redujeras estos gastos en un ${savingPercentage.toFixed(2)}%, podrías ahorrar aproximadamente <strong>${potentialSaving.toFixed(
      2
    )} ${trip.currency}</strong>.</p>`;
  }

  function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const tripId = parseInt(
      document.getElementById("trip-select-summary").value
    );
    const trip = findTripById(tripId);
    if (!trip) return;

    const totalExpenses = trip.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const remaining = trip.totalBudget - totalExpenses;

    let y = 20; // posición inicial
    const pageHeight = doc.internal.pageSize.height; // altura de la página

    // función auxiliar para manejar saltos de página
    function checkPageSpace(extra = 10) {
      if (y + extra > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    }

    // --- Cabecera ---
    doc.setFontSize(20);
    doc.text(`Reporte de Viaje: ${trip.destination}`, 10, y);
    y += 10;

    doc.setFontSize(12);
    [
      `Fechas: ${trip.startDate} a ${trip.endDate}`,
      `Presupuesto Total: ${trip.totalBudget.toFixed(2)} ${trip.currency}`,
      `Gasto Total: ${totalExpenses.toFixed(2)} ${trip.currency}`,
      `Balance Final: ${remaining.toFixed(2)} ${trip.currency}`,
    ].forEach((line) => {
      checkPageSpace(10);
      doc.text(line, 10, y);
      y += 10;
    });

    // --- Desglose de gastos ---
    checkPageSpace(15);
    doc.setFontSize(14);
    doc.text("Desglose de Gastos por Categoría:", 10, y);
    y += 10;

    const actualSpending = Object.keys(trip.categoryBudgets).map((cat) => ({
      category: cat,
      total: trip.expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0),
    }));

    doc.setFontSize(12);
    actualSpending.forEach((item) => {
      checkPageSpace(8);
      doc.text(
        `${item.category}: ${item.total.toFixed(2)} ${trip.currency}`,
        15,
        y
      );
      y += 8;
    });

    // --- Gastos destacados ---
    const topExpenses = document.getElementById(
      "top-expenses-display"
    ).innerText;
    checkPageSpace(15);
    doc.setFontSize(14);
    doc.text(topExpenses, 10, y);
    y += 12;

    // --- Gráficos ---
    const imgCanvas = document.querySelector("#budget-vs-actual-chart");
    const imgCanvas2 = document.querySelector("#category-spending-chart");
    const chart1Image = imgCanvas.toDataURL("image/png", 0.3);
    const chart2Image = imgCanvas2.toDataURL("image/png", 0.3);

    checkPageSpace(210);
    doc.addImage(chart1Image, "PNG", 10, y, 190, 100);
    y += 110;

    checkPageSpace(110);
    doc.addImage(chart2Image, "PNG", 10, y, 190, 100);
    y += 110;
    const filteredExpenses = document.getElementById(
      "filtered-expenses-display"
    ).innerText;
    checkPageSpace(200);
    doc.text(filteredExpenses, 10, y);
    y += 12;

    //  --- Escenario de ahorro ---
    const savingsScenario = document.getElementById(
      "savings-scenarios-display"
    ).innerText  ;
    checkPageSpace(300);
    doc.text(savingsScenario, 10, y);
    y += 12;

    // --- Guardar PDF ---
    doc.save(`Reporte_Viaje_${trip.destination}.pdf`);
  }

  // --- FUNCIONES AUXILIARES ---
  function findTripById(id) {
    return trips.find((t) => t.id === id);
  }

  function updateTripSelects() {
    const currentTripId = trips.length > 0 ? trips[trips.length - 1].id : "";
    tripSelects.forEach((select) => {
      select.innerHTML = trips
        .map(
          (trip) => `<option value="${trip.id}">${trip.destination}</option>`
        )
        .join("");
      if (currentTripId) select.value = currentTripId;
    });
    if (trips.length > 0) {
      updateSummary(currentTripId);
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
      "<h4>Presupuestos por Categoría:</h4>" +
      Object.entries(trip.categoryBudgets)
        .map(
          ([cat, amt]) => `<p>${cat}: ${amt.toFixed(2)} ${trip.currency}</p>`
        )
        .join("");
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

  (function () {
    emailjs.init(""); // Reemplaza con tu clave pública
  })();

  emailReportBtn.addEventListener("click", function () {
    const trip = document.getElementById("trip-select-summary").value;
    // const summary = document.getElementById("summary-display").innerHTML;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const tripName =
      document.getElementById("trip-select-summary").value || "Mi Viaje";
    const summary =
      document.getElementById("summary-display").innerText ||
      "Sin resumen disponible.";

    doc.setFontSize(16);
    doc.text("Resumen del Presupuesto de Viaje", 20, 20);
    doc.setFontSize(12);
    doc.text(`Viaje: ${tripName}`, 20, 30);
    doc.text(summary, 20, 40);

    // 2️⃣ Convertir a Base64
    const pdfBase64 =  doc.output("datauristring"); // quitar encabezado "data:application/pdf;base64,"
    // 3️⃣ Enviar el correo
    emailjs
      .send("", "", {
        to_name: "Usuario", // Reemplaza con el nombre del destinatario
        trip_name: tripName,
        message: "Adjunto el resumen de tu viaje en PDF.",
        my_file: pdfBase64,
        file_name: `Resumen_${tripName}.pdf`,
        email: "", // Reemplaza con el email del destinatario
      })
      .then(
        function (response) {
          alert("✅ Correo enviado correctamente!");
        },
        function (error) {
          alert("❌ Error al enviar el correo: " + JSON.stringify(error));
        }
      );
  });
});
