/**
 * Kalkulator Kredytowy — Główny skrypt aplikacji
 * Obsługa motywów, obliczeń finansowych w czasie rzeczywistym oraz interakcji UI.
 */

'use strict';

// =============================================================================
// 1. Moduł Motywu (Light / Dark Mode)
// =============================================================================
const ThemeManager = (() => {
    const STORAGE_KEY = 'toolbox_theme';
    const root = document.documentElement;
    let toggleBtn = null;

    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
            return saved;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (toggleBtn) {
            const isDark = theme === 'dark';
            const label = isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw';
            toggleBtn.setAttribute('aria-label', label);
            toggleBtn.setAttribute('title', label);
        }
    }

    function init() {
        toggleBtn = document.getElementById('themeToggle');
        applyTheme(getPreferredTheme());

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                localStorage.setItem(STORAGE_KEY, next);
                applyTheme(next);
            });
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    return { init, applyTheme, getPreferredTheme };
})();

// =============================================================================
// 2. Silnik Finansowy (Loan Engine)
// =============================================================================
const LoanEngine = (() => {
    /**
     * Oblicza harmonogram i podsumowanie dla rat równych (annuitetowych)
     */
    function calculateAnnuity(principal, annualRate, months) {
        const monthlyRate = annualRate / 12;
        let monthlyInstallment = 0;

        if (monthlyRate === 0) {
            monthlyInstallment = principal / months;
        } else {
            monthlyInstallment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
        }

        const totalRepaid = monthlyInstallment * months;
        const totalInterest = totalRepaid - principal;
        const schedule = [];
        let remaining = principal;

        for (let m = 1; m <= months; m++) {
            const interestPart = remaining * monthlyRate;
            const principalPart = monthlyInstallment - interestPart;
            remaining = Math.max(0, remaining - principalPart);

            schedule.push({
                month: m,
                installment: monthlyInstallment,
                principal: principalPart,
                interest: interestPart,
                remaining: remaining
            });
        }

        return {
            firstInstallment: monthlyInstallment,
            lastInstallment: monthlyInstallment,
            totalRepaid,
            totalInterest,
            schedule
        };
    }

    /**
     * Oblicza harmonogram i podsumowanie dla rat malejących
     */
    function calculateDecreasing(principal, annualRate, months) {
        const monthlyRate = annualRate / 12;
        const fixedPrincipalPart = principal / months;
        let remaining = principal;
        let totalRepaid = 0;
        let totalInterest = 0;
        let firstInstallment = 0;
        let lastInstallment = 0;
        const schedule = [];

        for (let m = 1; m <= months; m++) {
            const interestPart = remaining * monthlyRate;
            const installment = fixedPrincipalPart + interestPart;
            remaining = Math.max(0, remaining - fixedPrincipalPart);

            if (m === 1) firstInstallment = installment;
            if (m === months) lastInstallment = installment;

            totalRepaid += installment;
            totalInterest += interestPart;

            schedule.push({
                month: m,
                installment: installment,
                principal: fixedPrincipalPart,
                interest: interestPart,
                remaining: remaining
            });
        }

        return {
            firstInstallment,
            lastInstallment,
            totalRepaid,
            totalInterest,
            schedule
        };
    }

    return { calculateAnnuity, calculateDecreasing };
})();

// =============================================================================
// 3. Kontroler Aplikacji i Interfejs Użytkownika (App Controller)
// =============================================================================
const LoanApp = (() => {
    // Formatowania walut i liczb
    const currencyFormatter = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const percentFormatter = new Intl.NumberFormat('pl-PL', {
        maximumFractionDigits: 1
    });

    // Stan
    const state = {
        amount: 100000,
        period: 5,
        unit: 'years',      // 'years' | 'months'
        interest: 8.5,
        commission: 0,
        type: 'stable',     // 'stable' | 'decreasing'
        lastResult: null
    };

    // Referencje DOM
    let elements = {};

    function cacheDOM() {
        elements = {
            form: document.getElementById('loanForm'),
            amountInput: document.getElementById('amountInput'),
            amountSlider: document.getElementById('amountSlider'),
            installmentsInput: document.getElementById('installmentsInput'),
            installmentsSlider: document.getElementById('installmentsSlider'),
            unitYears: document.getElementById('unitYears'),
            unitMonths: document.getElementById('unitMonths'),
            unitSuffix: document.getElementById('unitSuffix'),
            interestInput: document.getElementById('interestInput'),
            interestSlider: document.getElementById('interestSlider'),
            commissionInput: document.getElementById('commissionInput'),
            commissionSlider: document.getElementById('commissionSlider'),
            tabStable: document.getElementById('tabStable'),
            tabDecreasing: document.getElementById('tabDecreasing'),
            resetBtn: document.getElementById('resetBtn'),

            // Wyniki
            heroInstallmentLabel: document.getElementById('heroInstallmentLabel'),
            heroInstallmentValue: document.getElementById('heroInstallmentValue'),
            heroInstallmentSubtext: document.getElementById('heroInstallmentSubtext'),
            totalRepayment: document.getElementById('totalRepayment'),
            totalCost: document.getElementById('totalCost'),
            principalAmount: document.getElementById('principalAmount'),
            commissionCost: document.getElementById('commissionCost'),

            // Pasek podziału
            barPrincipal: document.getElementById('barPrincipal'),
            barInterest: document.getElementById('barInterest'),
            barCommission: document.getElementById('barCommission'),
            legendPrincipalVal: document.getElementById('legendPrincipalVal'),
            legendInterestVal: document.getElementById('legendInterestVal'),
            legendCommissionVal: document.getElementById('legendCommissionVal'),

            // Tabela
            scheduleTableBody: document.getElementById('scheduleTableBody'),
            toggleScheduleBtn: document.getElementById('toggleScheduleBtn'),
            scheduleContainer: document.getElementById('scheduleContainer'),
            scheduleRowsCount: document.getElementById('scheduleRowsCount'),

            // Akcje
            copySummaryBtn: document.getElementById('copySummaryBtn'),
            printBtn: document.getElementById('printBtn'),
            toast: document.getElementById('toast'),
            resultsSection: document.getElementById('resultsSection')
        };
    }

    function updateSliderFill(slider) {
        if (!slider) return;
        const min = Number(slider.min) || 0;
        const max = Number(slider.max) || 100;
        const val = Number(slider.value) || 0;
        const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
        slider.style.setProperty('--slider-fill', `${percent}%`);
    }

    function updateInstallmentsSliderLimits() {
        if (state.unit === 'years') {
            elements.installmentsSlider.min = '1';
            elements.installmentsSlider.max = '35';
            elements.installmentsSlider.step = '1';
            elements.installmentsInput.min = '1';
            elements.installmentsInput.max = '35';
            elements.unitSuffix.textContent = 'lat';
        } else {
            elements.installmentsSlider.min = '3';
            elements.installmentsSlider.max = '420';
            elements.installmentsSlider.step = '1';
            elements.installmentsInput.min = '3';
            elements.installmentsInput.max = '420';
            elements.unitSuffix.textContent = 'mies.';
        }
    }

    function setUnit(newUnit) {
        if (newUnit === state.unit) return;
        let val = parseInt(elements.installmentsInput.value, 10) || 1;

        if (newUnit === 'months' && state.unit === 'years') {
            val = Math.round(val * 12);
        } else if (newUnit === 'years' && state.unit === 'months') {
            val = Math.max(1, Math.round(val / 12));
        }

        state.unit = newUnit;
        updateInstallmentsSliderLimits();

        elements.installmentsInput.value = val;
        elements.installmentsSlider.value = val;
        updateSliderFill(elements.installmentsSlider);

        elements.unitYears.classList.toggle('active', newUnit === 'years');
        elements.unitMonths.classList.toggle('active', newUnit === 'months');

        calculate();
    }

    function setInstallmentType(type) {
        state.type = type;
        const isStable = type === 'stable';

        elements.tabStable.classList.toggle('active', isStable);
        elements.tabStable.setAttribute('aria-selected', isStable ? 'true' : 'false');

        elements.tabDecreasing.classList.toggle('active', !isStable);
        elements.tabDecreasing.setAttribute('aria-selected', !isStable ? 'true' : 'false');

        calculate();
    }

    function calculate() {
        const principal = parseFloat(elements.amountInput.value) || 0;
        let period = parseInt(elements.installmentsInput.value, 10) || 1;
        const interestRate = (parseFloat(elements.interestInput.value) || 0) / 100;
        const commissionRate = (parseFloat(elements.commissionInput.value) || 0) / 100;

        if (principal <= 0 || period <= 0) return;

        const months = state.unit === 'years' ? period * 12 : period;
        const commissionAmount = principal * commissionRate;
        const totalLoanAmount = principal + commissionAmount;

        let calcResult = null;
        if (state.type === 'stable') {
            calcResult = LoanEngine.calculateAnnuity(totalLoanAmount, interestRate, months);
        } else {
            calcResult = LoanEngine.calculateDecreasing(totalLoanAmount, interestRate, months);
        }

        const totalCost = calcResult.totalInterest + commissionAmount;

        state.lastResult = {
            principal,
            months,
            period,
            unit: state.unit,
            interestPercent: interestRate * 100,
            commissionPercent: commissionRate * 100,
            commissionAmount,
            type: state.type,
            firstInstallment: calcResult.firstInstallment,
            lastInstallment: calcResult.lastInstallment,
            totalRepaid: calcResult.totalRepaid,
            totalInterest: calcResult.totalInterest,
            totalCost,
            schedule: calcResult.schedule
        };

        renderResults(state.lastResult);
    }

    function renderResults(result) {
        // Główna karta z ratą
        if (result.type === 'stable') {
            elements.heroInstallmentLabel.textContent = 'Miesięczna rata (stała)';
            elements.heroInstallmentValue.textContent = currencyFormatter.format(result.firstInstallment);
            elements.heroInstallmentSubtext.textContent = `Stała kwota przez cały okres ${result.months} miesięcy`;
        } else {
            elements.heroInstallmentLabel.textContent = 'Pierwsza rata (malejąca)';
            elements.heroInstallmentValue.textContent = currencyFormatter.format(result.firstInstallment);
            elements.heroInstallmentSubtext.textContent = `Ostatnia rata: ${currencyFormatter.format(result.lastInstallment)} · Rata maleje co miesiąc`;
        }

        // Kafelki podsumowania
        elements.totalRepayment.textContent = currencyFormatter.format(result.totalRepaid);
        elements.totalCost.textContent = currencyFormatter.format(result.totalCost);
        elements.principalAmount.textContent = currencyFormatter.format(result.principal);
        elements.commissionCost.textContent = currencyFormatter.format(result.commissionAmount);

        // Pasek struktury
        const total = result.totalRepaid;
        const pPct = total > 0 ? (result.principal / total) * 100 : 100;
        const iPct = total > 0 ? (result.totalInterest / total) * 100 : 0;
        const cPct = total > 0 ? (result.commissionAmount / total) * 100 : 0;

        elements.barPrincipal.style.width = `${pPct}%`;
        elements.barInterest.style.width = `${iPct}%`;
        elements.barCommission.style.width = `${cPct}%`;

        elements.legendPrincipalVal.textContent = `${currencyFormatter.format(result.principal)} (${percentFormatter.format(pPct)}%)`;
        elements.legendInterestVal.textContent = `${currencyFormatter.format(result.totalInterest)} (${percentFormatter.format(iPct)}%)`;
        elements.legendCommissionVal.textContent = `${currencyFormatter.format(result.commissionAmount)} (${percentFormatter.format(cPct)}%)`;

        if (elements.scheduleRowsCount) {
            elements.scheduleRowsCount.textContent = `(${result.months} rat)`;
        }

        renderScheduleTable(result.schedule);
    }

    function renderScheduleTable(schedule) {
        if (!elements.scheduleTableBody) return;
        elements.scheduleTableBody.innerHTML = '';

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
        elements.scheduleTableBody.appendChild(fragment);
    }

    function showToast(message) {
        if (!elements.toast) return;
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    function bindEvents() {
        // Synchronizacja suwaków i pól
        const syncPairs = [
            { input: elements.amountInput, slider: elements.amountSlider, isFloat: false },
            { input: elements.installmentsInput, slider: elements.installmentsSlider, isFloat: false },
            { input: elements.interestInput, slider: elements.interestSlider, isFloat: true },
            { input: elements.commissionInput, slider: elements.commissionSlider, isFloat: true }
        ];

        syncPairs.forEach(({ input, slider, isFloat }) => {
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
        });

        // Przełączniki jednostek
        elements.unitYears.addEventListener('click', () => setUnit('years'));
        elements.unitMonths.addEventListener('click', () => setUnit('months'));

        // Przełączniki rat
        elements.tabStable.addEventListener('click', () => setInstallmentType('stable'));
        elements.tabDecreasing.addEventListener('click', () => setInstallmentType('decreasing'));

        // Chipy / Presety kwot
        document.querySelectorAll('.chip[data-amount]').forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.getAttribute('data-amount');
                elements.amountInput.value = val;
                elements.amountSlider.value = val;
                updateSliderFill(elements.amountSlider);
                calculate();
            });
        });

        // Chipy / Presety okresów
        document.querySelectorAll('.chip[data-period]').forEach(chip => {
            chip.addEventListener('click', () => {
                const period = parseInt(chip.getAttribute('data-period'), 10);
                const unit = chip.getAttribute('data-unit') || 'years';
                setUnit(unit);
                elements.installmentsInput.value = period;
                elements.installmentsSlider.value = period;
                updateSliderFill(elements.installmentsSlider);
                calculate();
            });
        });

        // Harmonogram (Accordion)
        if (elements.toggleScheduleBtn && elements.scheduleContainer) {
            elements.toggleScheduleBtn.addEventListener('click', () => {
                const isCollapsed = elements.scheduleContainer.classList.contains('collapsed');
                if (isCollapsed) {
                    elements.scheduleContainer.classList.remove('collapsed');
                    elements.toggleScheduleBtn.setAttribute('aria-expanded', 'true');
                    elements.toggleScheduleBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        <span>Zwiń harmonogram</span>
                    `;
                } else {
                    elements.scheduleContainer.classList.add('collapsed');
                    elements.toggleScheduleBtn.setAttribute('aria-expanded', 'false');
                    elements.toggleScheduleBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        <span>Pokaż pełny harmonogram</span>
                    `;
                }
            });
        }

        // Kopiowanie podsumowania
        if (elements.copySummaryBtn) {
            elements.copySummaryBtn.addEventListener('click', async () => {
                if (!state.lastResult) calculate();
                const r = state.lastResult;
                const typeName = r.type === 'stable' ? 'Raty równe (annuitetowe)' : 'Raty malejące';
                const rateLine = r.type === 'stable'
                    ? `Miesięczna rata: ${currencyFormatter.format(r.firstInstallment)}`
                    : `Pierwsza rata: ${currencyFormatter.format(r.firstInstallment)}\nOstatnia rata: ${currencyFormatter.format(r.lastInstallment)}`;

                const text =
`📊 SYMULACJA KREDYTU — KALKULATOR
---------------------------------------------
Kwota kredytu:          ${currencyFormatter.format(r.principal)}
Okres spłaty:           ${r.period} ${r.unit === 'years' ? 'lat' : 'miesięcy'} (${r.months} rat)
Oprocentowanie:         ${r.interestPercent.toFixed(2)}%
Prowizja banku:         ${r.commissionPercent.toFixed(2)}% (${currencyFormatter.format(r.commissionAmount)})
System spłaty:          ${typeName}
---------------------------------------------
${rateLine}
Całkowita kwota spłaty: ${currencyFormatter.format(r.totalRepaid)}
Całkowity koszt:        ${currencyFormatter.format(r.totalCost)} (w tym odsetki: ${currencyFormatter.format(r.totalInterest)})
---------------------------------------------
Wygenerowano w: Narzędziownik / Kalkulator Kredytowy`;

                try {
                    await navigator.clipboard.writeText(text);
                    showToast('✓ Podsumowanie skopiowane do schowka!');
                } catch {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    showToast('✓ Podsumowanie skopiowane do schowka!');
                }
            });
        }

        // Drukuj
        if (elements.printBtn) {
            elements.printBtn.addEventListener('click', () => window.print());
        }

        // Formularz
        if (elements.form) {
            elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                calculate();
                if (window.innerWidth < 960 && elements.resultsSection) {
                    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Reset
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                elements.amountInput.value = '100000';
                elements.amountSlider.value = '100000';
                updateSliderFill(elements.amountSlider);

                setUnit('years');
                elements.installmentsInput.value = '5';
                elements.installmentsSlider.value = '5';
                updateSliderFill(elements.installmentsSlider);

                elements.interestInput.value = '8.5';
                elements.interestSlider.value = '8.5';
                updateSliderFill(elements.interestSlider);

                elements.commissionInput.value = '0';
                elements.commissionSlider.value = '0';
                updateSliderFill(elements.commissionSlider);

                setInstallmentType('stable');
                calculate();
                showToast('Przywrócono parametry domyślne');
            });
        }
    }

    function init() {
        cacheDOM();
        updateInstallmentsSliderLimits();
        bindEvents();
        calculate();
    }

    return { init };
})();

// =============================================================================
// Inicjalizacja Aplikacji
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    LoanApp.init();
});
