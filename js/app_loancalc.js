// Modern Loan Calculator Logic
(function () {
    // DOM Elements - Inputs & Sliders
    const amountInput = document.getElementById('amountInput');
    const amountSlider = document.getElementById('amountSlider');
    const installmentsInput = document.getElementById('installmentsInput');
    const installmentsSlider = document.getElementById('installmentsSlider');
    const unitYearsBtn = document.getElementById('unitYears');
    const unitMonthsBtn = document.getElementById('unitMonths');
    const interestInput = document.getElementById('interestInput');
    const interestSlider = document.getElementById('interestSlider');
    const commissionInput = document.getElementById('commissionInput');
    const commissionSlider = document.getElementById('commissionSlider');
    const form = document.getElementById('loanForm');
    const resetBtn = document.getElementById('resetBtn');

    // Tab buttons for installment types
    const tabStable = document.getElementById('tabStable');
    const tabDecreasing = document.getElementById('tabDecreasing');

    // DOM Elements - Results Display
    const heroInstallmentValue = document.getElementById('heroInstallmentValue');
    const heroInstallmentLabel = document.getElementById('heroInstallmentLabel');
    const heroInstallmentSubtext = document.getElementById('heroInstallmentSubtext');
    const totalRepaymentEl = document.getElementById('totalRepayment');
    const totalCostEl = document.getElementById('totalCost');
    const principalAmountEl = document.getElementById('principalAmount');
    const commissionCostEl = document.getElementById('commissionCost');

    // Visual breakdown
    const barPrincipal = document.getElementById('barPrincipal');
    const barInterest = document.getElementById('barInterest');
    const barCommission = document.getElementById('barCommission');
    const legendPrincipalVal = document.getElementById('legendPrincipalVal');
    const legendInterestVal = document.getElementById('legendInterestVal');
    const legendCommissionVal = document.getElementById('legendCommissionVal');

    // Schedule table & toggle
    const scheduleTableBody = document.getElementById('scheduleTableBody');
    const toggleScheduleBtn = document.getElementById('toggleScheduleBtn');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const scheduleRowsCount = document.getElementById('scheduleRowsCount');

    // Actions
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    const printBtn = document.getElementById('printBtn');
    const toast = document.getElementById('toast');

    // Current State
    let currentUnit = 'years'; // 'years' | 'months'
    let currentType = 'stable'; // 'stable' | 'decreasing'
    let lastCalculation = null;

    // Currency Formatter
    const currencyFormatter = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const numberFormatter = new Intl.NumberFormat('pl-PL', {
        maximumFractionDigits: 2
    });

    // Helper: update range slider background track fill
    function updateSliderFill(slider) {
        if (!slider) return;
        const min = Number(slider.min) || 0;
        const max = Number(slider.max) || 100;
        const val = Number(slider.value) || 0;
        const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
        slider.style.setProperty('--slider-fill', `${percent}%`);
    }

    // Set slider limits based on time unit
    function updateInstallmentsSliderLimits() {
        if (currentUnit === 'years') {
            installmentsSlider.min = '1';
            installmentsSlider.max = '35';
            installmentsSlider.step = '1';
            installmentsInput.min = '1';
            installmentsInput.max = '35';
        } else {
            installmentsSlider.min = '3';
            installmentsSlider.max = '420';
            installmentsSlider.step = '1';
            installmentsInput.min = '3';
            installmentsInput.max = '420';
        }
    }

    // Synchronize inputs & sliders
    function syncInputWithSlider(input, slider, isFloat = false) {
        input.addEventListener('input', () => {
            let val = isFloat ? parseFloat(input.value) : parseInt(input.value, 10);
            if (isNaN(val)) val = 0;
            slider.value = val;
            updateSliderFill(slider);
            calculate();
        });

        slider.addEventListener('input', () => {
            input.value = slider.value;
            updateSliderFill(slider);
            calculate();
        });

        updateSliderFill(slider);
    }

    syncInputWithSlider(amountInput, amountSlider);
    syncInputWithSlider(installmentsInput, installmentsSlider);
    syncInputWithSlider(interestInput, interestSlider, true);
    syncInputWithSlider(commissionInput, commissionSlider, true);

    // Unit toggle (Lata / Miesiące)
    function setUnit(unit) {
        if (unit === currentUnit) return;
        let val = parseInt(installmentsInput.value, 10) || 1;
        if (unit === 'months' && currentUnit === 'years') {
            val = Math.round(val * 12);
        } else if (unit === 'years' && currentUnit === 'months') {
            val = Math.max(1, Math.round(val / 12));
        }

        currentUnit = unit;
        updateInstallmentsSliderLimits();
        installmentsInput.value = val;
        installmentsSlider.value = val;
        updateSliderFill(installmentsSlider);

        if (unit === 'years') {
            unitYearsBtn.classList.add('active');
            unitMonthsBtn.classList.remove('active');
        } else {
            unitMonthsBtn.classList.add('active');
            unitYearsBtn.classList.remove('active');
        }

        calculate();
    }

    unitYearsBtn.addEventListener('click', () => setUnit('years'));
    unitMonthsBtn.addEventListener('click', () => setUnit('months'));

    // Installment Type Switcher (Równe vs Malejące)
    function setInstallmentType(type) {
        currentType = type;
        if (type === 'stable') {
            tabStable.classList.add('active');
            tabDecreasing.classList.remove('active');
            tabStable.setAttribute('aria-selected', 'true');
            tabDecreasing.setAttribute('aria-selected', 'false');
        } else {
            tabDecreasing.classList.add('active');
            tabStable.classList.remove('active');
            tabDecreasing.setAttribute('aria-selected', 'true');
            tabStable.setAttribute('aria-selected', 'false');
        }
        calculate();
    }

    tabStable.addEventListener('click', () => setInstallmentType('stable'));
    tabDecreasing.addEventListener('click', () => setInstallmentType('decreasing'));

    // Preset Chips Handlers
    document.querySelectorAll('.chip[data-amount]').forEach(chip => {
        chip.addEventListener('click', () => {
            const val = chip.getAttribute('data-amount');
            amountInput.value = val;
            amountSlider.value = val;
            updateSliderFill(amountSlider);
            calculate();
        });
    });

    document.querySelectorAll('.chip[data-period]').forEach(chip => {
        chip.addEventListener('click', () => {
            const period = parseInt(chip.getAttribute('data-period'), 10);
            const unit = chip.getAttribute('data-unit') || 'years';
            setUnit(unit);
            installmentsInput.value = period;
            installmentsSlider.value = period;
            updateSliderFill(installmentsSlider);
            calculate();
        });
    });

    // Core Calculation Logic
    function calculate() {
        const K = parseFloat(amountInput.value) || 0;
        let n = parseInt(installmentsInput.value, 10) || 1;
        const interestPercent = parseFloat(interestInput.value) || 0;
        const commissionPercent = parseFloat(commissionInput.value) || 0;

        if (currentUnit === 'years') {
            n = n * 12;
        }

        if (K <= 0 || n <= 0) {
            return;
        }

        const i = interestPercent / 100;
        const P = commissionPercent / 100;
        const commissionAmount = K * P;
        const K_total = K + commissionAmount;
        const monthlyRate = i / 12;

        const schedule = [];
        let totalRepaid = 0;
        let totalInterestPaid = 0;
        let firstInstallment = 0;
        let lastInstallment = 0;

        if (currentType === 'stable') {
            // Annuity formula (Raty równe)
            let monthlyInstallment = 0;
            if (monthlyRate === 0) {
                monthlyInstallment = K_total / n;
            } else {
                monthlyInstallment = (K_total * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
            }

            firstInstallment = monthlyInstallment;
            lastInstallment = monthlyInstallment;
            totalRepaid = monthlyInstallment * n;
            totalInterestPaid = totalRepaid - K_total;

            let remainingBalance = K_total;
            for (let m = 1; m <= n; m++) {
                const interestPart = remainingBalance * monthlyRate;
                const principalPart = monthlyInstallment - interestPart;
                remainingBalance = Math.max(0, remainingBalance - principalPart);

                schedule.push({
                    month: m,
                    installment: monthlyInstallment,
                    principal: principalPart,
                    interest: interestPart,
                    remaining: remainingBalance
                });
            }
        } else {
            // Decreasing installments (Raty malejące)
            const principalPart = K_total / n;
            let remainingBalance = K_total;

            for (let m = 1; m <= n; m++) {
                const interestPart = remainingBalance * monthlyRate;
                const installment = principalPart + interestPart;
                remainingBalance = Math.max(0, remainingBalance - principalPart);

                if (m === 1) firstInstallment = installment;
                if (m === n) lastInstallment = installment;

                totalRepaid += installment;
                totalInterestPaid += interestPart;

                schedule.push({
                    month: m,
                    installment: installment,
                    principal: principalPart,
                    interest: interestPart,
                    remaining: remainingBalance
                });
            }
        }

        const totalCost = totalInterestPaid + commissionAmount;

        lastCalculation = {
            principal: K,
            months: n,
            unit: currentUnit,
            interestPercent,
            commissionPercent,
            commissionAmount,
            type: currentType,
            firstInstallment,
            lastInstallment,
            totalRepaid,
            totalCost,
            totalInterestPaid,
            schedule
        };

        renderResults(lastCalculation);
    }

    function renderResults(calc) {
        // Hero metric
        if (calc.type === 'stable') {
            heroInstallmentLabel.textContent = 'Miesięczna rata (stała)';
            heroInstallmentValue.textContent = currencyFormatter.format(calc.firstInstallment);
            heroInstallmentSubtext.textContent = `Stała kwota przez cały okres ${calc.months} miesięcy`;
        } else {
            heroInstallmentLabel.textContent = 'Pierwsza rata (malejąca)';
            heroInstallmentValue.textContent = currencyFormatter.format(calc.firstInstallment);
            heroInstallmentSubtext.textContent = `Ostatnia rata: ${currencyFormatter.format(calc.lastInstallment)} · Rata spada co miesiąc`;
        }

        // Summary cards
        totalRepaymentEl.textContent = currencyFormatter.format(calc.totalRepaid);
        totalCostEl.textContent = currencyFormatter.format(calc.totalCost);
        principalAmountEl.textContent = currencyFormatter.format(calc.principal);
        commissionCostEl.textContent = currencyFormatter.format(calc.commissionAmount);

        // Visual breakdown bar
        const total = calc.totalRepaid;
        const principalPct = total > 0 ? (calc.principal / total) * 100 : 100;
        const interestPct = total > 0 ? (calc.totalInterestPaid / total) * 100 : 0;
        const commissionPct = total > 0 ? (calc.commissionAmount / total) * 100 : 0;

        barPrincipal.style.width = `${principalPct}%`;
        barInterest.style.width = `${interestPct}%`;
        barCommission.style.width = `${commissionPct}%`;

        legendPrincipalVal.textContent = `${currencyFormatter.format(calc.principal)} (${numberFormatter.format(principalPct)}%)`;
        legendInterestVal.textContent = `${currencyFormatter.format(calc.totalInterestPaid)} (${numberFormatter.format(interestPct)}%)`;
        legendCommissionVal.textContent = `${currencyFormatter.format(calc.commissionAmount)} (${numberFormatter.format(commissionPct)}%)`;

        // Schedule table count
        if (scheduleRowsCount) {
            scheduleRowsCount.textContent = `(${calc.months} rat)`;
        }

        renderScheduleTable(calc.schedule);
    }

    function renderScheduleTable(schedule) {
        if (!scheduleTableBody) return;
        scheduleTableBody.innerHTML = '';

        // Render rows
        const fragment = document.createDocumentFragment();
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="col-nr">#${row.month}</td>
                <td class="col-installment font-semibold">${currencyFormatter.format(row.installment)}</td>
                <td class="col-principal text-muted">${currencyFormatter.format(row.principal)}</td>
                <td class="col-interest text-muted">${currencyFormatter.format(row.interest)}</td>
                <td class="col-remaining">${currencyFormatter.format(row.remaining)}</td>
            `;
            fragment.appendChild(tr);
        });
        scheduleTableBody.appendChild(fragment);
    }

    // Toggle Schedule Table Accordion
    if (toggleScheduleBtn && scheduleContainer) {
        toggleScheduleBtn.addEventListener('click', () => {
            const isHidden = scheduleContainer.classList.contains('collapsed');
            if (isHidden) {
                scheduleContainer.classList.remove('collapsed');
                toggleScheduleBtn.setAttribute('aria-expanded', 'true');
                toggleScheduleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    Zwiń harmonogram
                `;
            } else {
                scheduleContainer.classList.add('collapsed');
                toggleScheduleBtn.setAttribute('aria-expanded', 'false');
                toggleScheduleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    Pokaż pełny harmonogram spłat
                `;
            }
        });
    }

    // Copy Summary to Clipboard
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    if (copySummaryBtn) {
        copySummaryBtn.addEventListener('click', async () => {
            if (!lastCalculation) calculate();
            const c = lastCalculation;
            const typeLabel = c.type === 'stable' ? 'Raty równe (annuitetowe)' : 'Raty malejące';
            const rateInfo = c.type === 'stable'
                ? `Miesięczna rata: ${currencyFormatter.format(c.firstInstallment)}`
                : `Pierwsza rata: ${currencyFormatter.format(c.firstInstallment)}\nOstatnia rata: ${currencyFormatter.format(c.lastInstallment)}`;

            const summaryText =
`📊 SYMULACJA KREDYTU — KALKULATOR
---------------------------------------------
Kwota kredytu:          ${currencyFormatter.format(c.principal)}
Okres spłaty:           ${installmentsInput.value} ${currentUnit === 'years' ? 'lat' : 'miesięcy'} (${c.months} rat)
Oprocentowanie:         ${c.interestPercent.toFixed(2)}%
Prowizja banku:         ${c.commissionPercent.toFixed(2)}% (${currencyFormatter.format(c.commissionAmount)})
System spłaty:          ${typeLabel}
---------------------------------------------
${rateInfo}
Całkowita kwota spłaty: ${currencyFormatter.format(c.totalRepaid)}
Całkowity koszt:        ${currencyFormatter.format(c.totalCost)} (w tym odsetki: ${currencyFormatter.format(c.totalInterestPaid)})
---------------------------------------------
Wygenerowano w: Narzędziownik / Kalkulator Kredytowy`;

            try {
                await navigator.clipboard.writeText(summaryText);
                showToast('✓ Podsumowanie skopiowane do schowka!');
            } catch (err) {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = summaryText;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('✓ Podsumowanie skopiowane do schowka!');
            }
        });
    }

    // Print
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Form submit / calculate button
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            calculate();
            // On mobile, smooth scroll to results
            if (window.innerWidth < 960) {
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            amountInput.value = '100000';
            amountSlider.value = '100000';
            updateSliderFill(amountSlider);

            setUnit('years');
            installmentsInput.value = '5';
            installmentsSlider.value = '5';
            updateSliderFill(installmentsSlider);

            interestInput.value = '8.5';
            interestSlider.value = '8.5';
            updateSliderFill(interestSlider);

            commissionInput.value = '0';
            commissionSlider.value = '0';
            updateSliderFill(commissionSlider);

            setInstallmentType('stable');
            calculate();
            showToast('Przywrócono parametry domyślne');
        });
    }

    // Initial Run on load
    document.addEventListener('DOMContentLoaded', () => {
        updateInstallmentsSliderLimits();
        updateSliderFill(amountSlider);
        updateSliderFill(installmentsSlider);
        updateSliderFill(interestSlider);
        updateSliderFill(commissionSlider);
        calculate();
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        updateInstallmentsSliderLimits();
        calculate();
    }
})();