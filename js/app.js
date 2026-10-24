/**
 * Kalkulator Kredytowy / Loan Calculator — Główny skrypt aplikacji
 * Obsługa motywów, i18n (PL/EN), obliczeń finansowych oraz interakcji UI.
 */

'use strict';

// =============================================================================
// 0. Moduł Językowy (i18n)
// =============================================================================
const i18n = (() => {
    const STORAGE_KEY = 'toolbox_lang';

    const translations = {
        pl: {
            // <head>
            pageTitle:              'Kalkulator Kredytowy | Precyzyjna Symulacja Finansowa',
            pageDesc:               'Nowoczesny kalkulator kredytowy: raty równe i malejące, harmonogram spłat, symulacja całkowitych kosztów i struktura spłaty.',

            // Header
            brandTitle:             'Kalkulator Kredytowy',
            brandSubtitle:          'Precyzyjna symulacja rat, kosztów oraz harmonogramu spłat',
            printTitle:             'Drukuj symulację',
            themeToggleLabel:       (isDark) => isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw',
            langToggleLabel:        'Switch to English',

            // Form card
            formStep:               '1',
            formTitle:              'Parametry kredytu',
            formDesc:               'Wprowadź warunki finansowania lub wybierz gotowe wartości',

            // Installment type
            labelInstallmentType:   'Rodzaj rat',
            tabStable:              'Raty równe',
            tabStableBadge:         'Popularne',
            tabDecreasing:          'Raty malejące',
            tabDecreasingBadge:     'Niższy koszt',

            // Amount
            labelAmount:            'Kwota kredytu',
            hintAmount:             'PLN',
            suffixAmount:           'zł',
            chip30k:                '30 tys.',
            chip50k:                '50 tys.',
            chip100k:               '100 tys.',
            chip300k:               '300 tys.',
            chip500k:               '500 tys.',

            // Period
            labelPeriod:            'Okres kredytowania',
            unitYears:              'Lata',
            unitMonths:             'Miesiące',
            suffixYears:            'lat',
            suffixMonths:           'mies.',
            chipPeriod1:            '1 rok',
            chipPeriod3:            '3 lata',
            chipPeriod5:            '5 lat',
            chipPeriod10:           '10 lat',
            chipPeriod25:           '25 lat',
            chipPeriod30:           '30 lat',

            // Interest & Commission
            labelInterest:          'Oprocentowanie',
            hintInterest:           'w skali roku',
            labelCommission:        'Prowizja banku',
            hintCommission:         'jednorazowa',

            // Commission payment
            labelCommPayment:       'Sposób płatności prowizji',
            commUpfront:            'Opłacona z góry',
            commUpfrontBadge:       'Niższe raty',
            commFinanced:           'Doliczona do kredytu',
            commFinancedBadge:      'W ratach',
            commHintUpfront:        'Prowizja płatna jednorazowo przy uruchomieniu kredytu — nie powiększa rat ani kosztu odsetek.',
            commHintFinanced:       'Prowizja doliczona do kwoty kredytu i spłacana w ratach — powiększa miesięczną ratę oraz całkowity koszt odsetek.',

            // Actions
            computeBtn:             'Przelicz raty',
            resetBtn:               'Domyślne',

            // Results card
            resultsStep:            '2',
            resultsTitle:           'Podsumowanie finansowe',
            resultsDesc:            'Miesięczna rata oraz pełna kalkulacja spłaty kapitału i odsetek',

            // Hero
            heroLabelStable:        'Miesięczna rata (stała)',
            heroLabelDecreasing:    'Pierwsza rata (malejąca)',
            heroSubtextDefault:     'Kalkulacja w czasie rzeczywistym',

            // Metrics
            metricTotalRepayment:   'Całkowita spłata',
            metricTotalCost:        'Całkowity koszt',
            metricPrincipal:        'Kwota kapitału',
            metricPrincipalSub:     'Kwota do dyspozycji',
            metricCommission:       'Prowizja banku',

            // Breakdown bar
            breakdownTitle:         'Struktura całkowitej spłaty',
            breakdownAriaLabel:     'Struktura kosztów kredytu',
            legendPrincipal:        'Kapitał:',
            legendInterest:         'Odsetki:',
            legendCommission:       'Prowizja:',

            // Schedule
            scheduleTitle:          'Harmonogram rat',
            scheduleCountFn:        (n) => `(${n} rat)`,
            showSchedule:           'Pokaż pełny harmonogram',
            hideSchedule:           'Zwiń harmonogram',
            thNr:                   'Nr raty',
            thInstallment:          'Rata całkowita',
            thPrincipal:            'Część kapitałowa',
            thInterest:             'Część odsetkowa',
            thRemaining:            'Pozostały kapitał',

            // Actions
            copySummaryBtn:         'Kopiuj podsumowanie do schowka',
            toastCopied:            '✓ Podsumowanie skopiowane do schowka!',
            toastReset:             'Przywrócono parametry domyślne',

            // Commission labels in results
            commLabelUpfront:       'Opłacona z góry',
            commLabelFinanced:      'Doliczona do kredytu',
            commLabelNone:          'Brak prowizji',
            commLabelPrincipalSub:  (amount, fmt) => `Skredytowano: ${fmt(amount)}`,

            // Dynamic subtexts
            heroSubStable:          (months, commLabel) => commLabel
                ? `Stała kwota przez ${months} miesięcy · Prowizja ${commLabel.toLowerCase()}`
                : `Stała kwota przez cały okres ${months} miesięcy`,
            heroSubDecreasing:      (lastInst, commLabel, fmt) => commLabel
                ? `Ostatnia rata: ${fmt(lastInst)} · Prowizja ${commLabel.toLowerCase()}`
                : `Ostatnia rata: ${fmt(lastInst)} · Rata maleje co miesiąc`,

            // Copy text template
            copyTemplate:           (r, fmt) => {
                const typeName     = r.type === 'stable' ? 'Raty równe (annuitetowe)' : 'Raty malejące';
                const commTypeDesc = r.commissionPayment === 'upfront' ? 'Opłacona z góry (środki własne)' : 'Doliczona do kredytu (w ratach)';
                const rateLine     = r.type === 'stable'
                    ? `Miesięczna rata:          ${fmt(r.firstInstallment)}`
                    : `Pierwsza rata:            ${fmt(r.firstInstallment)}\nOstatnia rata:            ${fmt(r.lastInstallment)}`;
                return `📊 SYMULACJA KREDYTU — KALKULATOR\n---------------------------------------------\nKwota kredytu:          ${fmt(r.principal)}\nOkres spłaty:           ${r.period} ${r.unit === 'years' ? 'lat' : 'miesięcy'} (${r.months} rat)\nOprocentowanie:         ${r.interestPercent.toFixed(2)}%\nProwizja banku:         ${r.commissionPercent.toFixed(2)}% (${fmt(r.commissionAmount)}) [${commTypeDesc}]\nSystem spłaty:          ${typeName}\n---------------------------------------------\n${rateLine}\nCałkowita kwota spłaty: ${fmt(r.totalRepaid)}\nCałkowity koszt:        ${fmt(r.totalCost)} (w tym odsetki: ${fmt(r.totalInterest)})\n---------------------------------------------\nWygenerowano w: Narzędziownik / Kalkulator Kredytowy`;
            },

            // Footer
            footerText:             'Kalkulator ma charakter wyłącznie informacyjny i poglądowy. Rzeczywiste warunki kredytu ustala bank.',
        },

        en: {
            pageTitle:              'Loan Calculator | Precise Financial Simulation',
            pageDesc:               'Modern loan calculator: fixed & decreasing installments, repayment schedule, total cost simulation and payment breakdown.',

            brandTitle:             'Loan Calculator',
            brandSubtitle:          'Precise simulation of installments, costs and repayment schedule',
            printTitle:             'Print simulation',
            themeToggleLabel:       (isDark) => isDark ? 'Switch to light mode' : 'Switch to dark mode',
            langToggleLabel:        'Przełącz na polski',

            formStep:               '1',
            formTitle:              'Loan Parameters',
            formDesc:               'Enter your financing conditions or choose preset values',

            labelInstallmentType:   'Installment type',
            tabStable:              'Fixed installments',
            tabStableBadge:         'Popular',
            tabDecreasing:          'Decreasing installments',
            tabDecreasingBadge:     'Lower cost',

            labelAmount:            'Loan amount',
            hintAmount:             'PLN',
            suffixAmount:           'PLN',
            chip30k:                '30k',
            chip50k:                '50k',
            chip100k:               '100k',
            chip300k:               '300k',
            chip500k:               '500k',

            labelPeriod:            'Loan term',
            unitYears:              'Years',
            unitMonths:             'Months',
            suffixYears:            'yrs',
            suffixMonths:           'mo.',
            chipPeriod1:            '1 yr',
            chipPeriod3:            '3 yrs',
            chipPeriod5:            '5 yrs',
            chipPeriod10:           '10 yrs',
            chipPeriod25:           '25 yrs',
            chipPeriod30:           '30 yrs',

            labelInterest:          'Interest rate',
            hintInterest:           'per year',
            labelCommission:        'Bank commission',
            hintCommission:         'one-time',

            labelCommPayment:       'Commission payment method',
            commUpfront:            'Paid upfront',
            commUpfrontBadge:       'Lower installments',
            commFinanced:           'Added to loan',
            commFinancedBadge:      'In installments',
            commHintUpfront:        'Commission paid once at loan disbursement — does not increase installments or interest cost.',
            commHintFinanced:       'Commission added to the loan amount and repaid in installments — increases monthly payment and total interest cost.',

            computeBtn:             'Calculate',
            resetBtn:               'Reset',

            resultsStep:            '2',
            resultsTitle:           'Financial Summary',
            resultsDesc:            'Monthly installment and full breakdown of principal and interest repayment',

            heroLabelStable:        'Monthly installment (fixed)',
            heroLabelDecreasing:    'First installment (decreasing)',
            heroSubtextDefault:     'Real-time calculation',

            metricTotalRepayment:   'Total repayment',
            metricTotalCost:        'Total cost',
            metricPrincipal:        'Principal amount',
            metricPrincipalSub:     'Available to you',
            metricCommission:       'Bank commission',

            breakdownTitle:         'Total repayment structure',
            breakdownAriaLabel:     'Loan cost structure',
            legendPrincipal:        'Principal:',
            legendInterest:         'Interest:',
            legendCommission:       'Commission:',

            scheduleTitle:          'Repayment schedule',
            scheduleCountFn:        (n) => `(${n} installments)`,
            showSchedule:           'Show full schedule',
            hideSchedule:           'Collapse schedule',
            thNr:                   'No.',
            thInstallment:          'Total installment',
            thPrincipal:            'Principal part',
            thInterest:             'Interest part',
            thRemaining:            'Remaining balance',

            copySummaryBtn:         'Copy summary to clipboard',
            toastCopied:            '✓ Summary copied to clipboard!',
            toastReset:             'Parameters reset to defaults',

            commLabelUpfront:       'Paid upfront',
            commLabelFinanced:      'Added to loan',
            commLabelNone:          'No commission',
            commLabelPrincipalSub:  (amount, fmt) => `Financed: ${fmt(amount)}`,

            heroSubStable:          (months, commLabel) => commLabel
                ? `Fixed amount for ${months} months · Commission ${commLabel.toLowerCase()}`
                : `Fixed amount for the entire ${months}-month period`,
            heroSubDecreasing:      (lastInst, commLabel, fmt) => commLabel
                ? `Last installment: ${fmt(lastInst)} · Commission ${commLabel.toLowerCase()}`
                : `Last installment: ${fmt(lastInst)} · Decreases each month`,

            copyTemplate:           (r, fmt) => {
                const typeName     = r.type === 'stable' ? 'Fixed installments (annuity)' : 'Decreasing installments';
                const commTypeDesc = r.commissionPayment === 'upfront' ? 'Paid upfront (own funds)' : 'Added to loan (in installments)';
                const rateLine     = r.type === 'stable'
                    ? `Monthly installment:      ${fmt(r.firstInstallment)}`
                    : `First installment:        ${fmt(r.firstInstallment)}\nLast installment:         ${fmt(r.lastInstallment)}`;
                return `📊 LOAN SIMULATION — CALCULATOR\n---------------------------------------------\nLoan amount:             ${fmt(r.principal)}\nLoan term:               ${r.period} ${r.unit === 'years' ? 'years' : 'months'} (${r.months} installments)\nInterest rate:           ${r.interestPercent.toFixed(2)}%\nBank commission:         ${r.commissionPercent.toFixed(2)}% (${fmt(r.commissionAmount)}) [${commTypeDesc}]\nRepayment system:        ${typeName}\n---------------------------------------------\n${rateLine}\nTotal repayment:         ${fmt(r.totalRepaid)}\nTotal cost:              ${fmt(r.totalCost)} (interest: ${fmt(r.totalInterest)})\n---------------------------------------------\nGenerated by: Loan Calculator`;
            },

            footerText:             'This calculator is for informational and illustrative purposes only. Actual loan terms are determined by the bank.',
        }
    };

    let currentLang = localStorage.getItem(STORAGE_KEY) || 'pl';

    function t(key, ...args) {
        const entry = translations[currentLang][key];
        if (typeof entry === 'function') return entry(...args);
        return entry ?? key;
    }

    function getLang() { return currentLang; }

    function setLang(lang) {
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
    }

    return { t, getLang, setLang, translations };
})();

// =============================================================================
// 1. Moduł Motywu (Light / Dark Mode)
// =============================================================================
const ThemeManager = (() => {
    const STORAGE_KEY = 'toolbox_theme';
    const root = document.documentElement;
    let toggleBtn = null;

    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (toggleBtn) {
            const label = i18n.t('themeToggleLabel', theme === 'dark');
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

    function refreshLabels() {
        applyTheme(root.getAttribute('data-theme') || 'light');
    }

    return { init, applyTheme, getPreferredTheme, refreshLabels };
})();

// =============================================================================
// 2. Silnik Finansowy (Loan Engine)
// =============================================================================
const LoanEngine = (() => {
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
            schedule.push({ month: m, installment: monthlyInstallment, principal: principalPart, interest: interestPart, remaining });
        }

        return { firstInstallment: monthlyInstallment, lastInstallment: monthlyInstallment, totalRepaid, totalInterest, schedule };
    }

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
            schedule.push({ month: m, installment, principal: fixedPrincipalPart, interest: interestPart, remaining });
        }

        return { firstInstallment, lastInstallment, totalRepaid, totalInterest, schedule };
    }

    return { calculateAnnuity, calculateDecreasing };
})();

// =============================================================================
// 3. Kontroler Aplikacji i Interfejs Użytkownika (App Controller)
// =============================================================================
const LoanApp = (() => {
    const currencyFormatter = new Intl.NumberFormat('pl-PL', {
        style: 'currency', currency: 'PLN',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    const percentFormatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

    const state = {
        amount: 100000,
        period: 5,
        unit: 'years',
        interest: 8.5,
        commission: 0,
        commissionPayment: 'upfront',
        type: 'stable',
        lastResult: null
    };

    let elements = {};

    function cacheDOM() {
        elements = {
            form:                   document.getElementById('loanForm'),
            amountInput:            document.getElementById('amountInput'),
            amountSlider:           document.getElementById('amountSlider'),
            installmentsInput:      document.getElementById('installmentsInput'),
            installmentsSlider:     document.getElementById('installmentsSlider'),
            unitYears:              document.getElementById('unitYears'),
            unitMonths:             document.getElementById('unitMonths'),
            unitSuffix:             document.getElementById('unitSuffix'),
            interestInput:          document.getElementById('interestInput'),
            interestSlider:         document.getElementById('interestSlider'),
            commissionInput:        document.getElementById('commissionInput'),
            commissionSlider:       document.getElementById('commissionSlider'),

            commissionPaymentGroup: document.getElementById('commissionPaymentGroup'),
            commUpfrontBtn:         document.getElementById('commUpfrontBtn'),
            commFinancedBtn:        document.getElementById('commFinancedBtn'),
            commissionAmountBadge:  document.getElementById('commissionAmountBadge'),
            commissionHint:         document.getElementById('commissionHint'),
            commissionPaymentLabel: document.getElementById('commissionPaymentLabel'),
            principalSubtext:       document.getElementById('principalSubtext'),

            tabStable:              document.getElementById('tabStable'),
            tabDecreasing:          document.getElementById('tabDecreasing'),
            resetBtn:               document.getElementById('resetBtn'),

            heroInstallmentLabel:   document.getElementById('heroInstallmentLabel'),
            heroInstallmentValue:   document.getElementById('heroInstallmentValue'),
            heroInstallmentSubtext: document.getElementById('heroInstallmentSubtext'),
            totalRepayment:         document.getElementById('totalRepayment'),
            totalCost:              document.getElementById('totalCost'),
            principalAmount:        document.getElementById('principalAmount'),
            commissionCost:         document.getElementById('commissionCost'),

            barPrincipal:           document.getElementById('barPrincipal'),
            barInterest:            document.getElementById('barInterest'),
            barCommission:          document.getElementById('barCommission'),
            legendPrincipalVal:     document.getElementById('legendPrincipalVal'),
            legendInterestVal:      document.getElementById('legendInterestVal'),
            legendCommissionVal:    document.getElementById('legendCommissionVal'),

            scheduleTableBody:      document.getElementById('scheduleTableBody'),
            toggleScheduleBtn:      document.getElementById('toggleScheduleBtn'),
            scheduleContainer:      document.getElementById('scheduleContainer'),
            scheduleRowsCount:      document.getElementById('scheduleRowsCount'),

            copySummaryBtn:         document.getElementById('copySummaryBtn'),
            printBtn:               document.getElementById('printBtn'),
            langToggleBtn:          document.getElementById('langToggleBtn'),
            toast:                  document.getElementById('toast'),
            resultsSection:         document.getElementById('resultsSection')
        };
    }

    // -------------------------------------------------------------------------
    // DOM i18n helpers
    // -------------------------------------------------------------------------
    function setText(id, key) {
        const el = document.getElementById(id);
        if (el) el.textContent = i18n.t(key);
    }

    function setAttr(id, attr, key) {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, i18n.t(key));
    }

    /**
     * Aktualizuje wszystkie statyczne teksty w DOM zgodnie z bieżącym językiem.
     */
    function applyTranslations() {
        const t = (k, ...a) => i18n.t(k, ...a);

        // <html lang>
        document.documentElement.lang = i18n.getLang();

        // <title> & meta description
        document.title = t('pageTitle');
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', t('pageDesc'));

        // Header
        setText('brandTitle', 'brandTitle');
        setText('brandSubtitle', 'brandSubtitle');

        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.setAttribute('title', t('printTitle'));
            printBtn.setAttribute('aria-label', t('printTitle'));
        }

        // Lang button label
        if (elements.langToggleBtn) {
            elements.langToggleBtn.setAttribute('title', t('langToggleLabel'));
            elements.langToggleBtn.setAttribute('aria-label', t('langToggleLabel'));
            elements.langToggleBtn.textContent = i18n.getLang() === 'pl' ? 'EN' : 'PL';
        }

        // Theme labels
        ThemeManager.refreshLabels();

        // Form card header
        setText('formHeading', 'formTitle');
        setText('formDesc', 'formDesc');

        // Installment type tabs
        const tabStable = document.getElementById('tabStable');
        if (tabStable) {
            tabStable.querySelector('.tab-title').textContent = t('tabStable');
            tabStable.querySelector('.tab-badge').textContent = t('tabStableBadge');
        }
        const tabDecreasing = document.getElementById('tabDecreasing');
        if (tabDecreasing) {
            tabDecreasing.querySelector('.tab-title').textContent = t('tabDecreasing');
            tabDecreasing.querySelector('.tab-badge').textContent = t('tabDecreasingBadge');
        }

        // Amount
        setText('labelAmount', 'labelAmount');
        setText('hintAmount', 'hintAmount');
        setText('suffixAmount', 'suffixAmount');
        setText('chip30k', 'chip30k');
        setText('chip50k', 'chip50k');
        setText('chip100k', 'chip100k');
        setText('chip300k', 'chip300k');
        setText('chip500k', 'chip500k');

        // Period
        setText('labelPeriod', 'labelPeriod');
        setText('unitYearsBtn', 'unitYears');
        setText('unitMonthsBtn', 'unitMonths');
        // suffix updated by setUnit / updateInstallmentsSliderLimits
        updateUnitSuffix();

        // Period chips
        setText('chipPeriod1', 'chipPeriod1');
        setText('chipPeriod3', 'chipPeriod3');
        setText('chipPeriod5', 'chipPeriod5');
        setText('chipPeriod10', 'chipPeriod10');
        setText('chipPeriod25', 'chipPeriod25');
        setText('chipPeriod30', 'chipPeriod30');

        // Interest & Commission
        setText('labelInterest', 'labelInterest');
        setText('hintInterest', 'hintInterest');
        setText('labelCommission', 'labelCommission');
        setText('hintCommission', 'hintCommission');

        // Commission payment
        setText('labelCommPayment', 'labelCommPayment');
        const commUpfrontBtn = document.getElementById('commUpfrontBtn');
        if (commUpfrontBtn) {
            commUpfrontBtn.querySelector('.tab-title').textContent = t('commUpfront');
            commUpfrontBtn.querySelector('.tab-badge').textContent = t('commUpfrontBadge');
        }
        const commFinancedBtn = document.getElementById('commFinancedBtn');
        if (commFinancedBtn) {
            commFinancedBtn.querySelector('.tab-title').textContent = t('commFinanced');
            commFinancedBtn.querySelector('.tab-badge').textContent = t('commFinancedBadge');
        }
        // hint updated by setCommissionPayment
        if (elements.commissionHint) {
            const isUpfront = state.commissionPayment === 'upfront';
            elements.commissionHint.textContent = t(isUpfront ? 'commHintUpfront' : 'commHintFinanced');
        }

        // Actions
        const computeBtn = document.getElementById('computeBtn');
        if (computeBtn) computeBtn.querySelector('span').textContent = t('computeBtn');
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.querySelector('span').textContent = t('resetBtn');

        // Results card header
        setText('resultsHeading', 'resultsTitle');
        setText('resultsDesc', 'resultsDesc');

        // Hero (default)
        if (elements.heroInstallmentSubtext && !state.lastResult) {
            elements.heroInstallmentSubtext.textContent = t('heroSubtextDefault');
        }

        // Metrics titles
        setText('metricTotalRepayment', 'metricTotalRepayment');
        setText('metricTotalCost', 'metricTotalCost');
        setText('metricPrincipal', 'metricPrincipal');
        setText('metricCommission', 'metricCommission');

        // Breakdown
        setText('breakdownTitle', 'breakdownTitle');
        const breakdownBar = document.querySelector('.breakdown-bar');
        if (breakdownBar) breakdownBar.setAttribute('aria-label', t('breakdownAriaLabel'));
        setText('legendPrincipalLabel', 'legendPrincipal');
        setText('legendInterestLabel', 'legendInterest');
        setText('legendCommissionLabel', 'legendCommission');

        // Schedule
        setText('scheduleTitle', 'scheduleTitle');
        // Update table headers
        const ths = document.querySelectorAll('.schedule-table thead th');
        if (ths.length === 5) {
            ths[0].textContent = t('thNr');
            ths[1].textContent = t('thInstallment');
            ths[2].textContent = t('thPrincipal');
            ths[3].textContent = t('thInterest');
            ths[4].textContent = t('thRemaining');
        }
        // Update toggle btn label
        if (elements.toggleScheduleBtn) {
            const isCollapsed = elements.scheduleContainer && elements.scheduleContainer.classList.contains('collapsed');
            updateToggleScheduleLabel(isCollapsed !== false);
        }

        // Copy btn
        const copySummaryBtn = document.getElementById('copySummaryBtn');
        if (copySummaryBtn) copySummaryBtn.querySelector('span').textContent = t('copySummaryBtn');

        // Footer
        setText('footerText', 'footerText');

        // Re-render dynamic results if available
        if (state.lastResult) {
            renderResults(state.lastResult);
        }
    }

    function updateUnitSuffix() {
        if (elements.unitSuffix) {
            elements.unitSuffix.textContent = state.unit === 'years'
                ? i18n.t('suffixYears')
                : i18n.t('suffixMonths');
        }
    }

    function updateToggleScheduleLabel(isCollapsed) {
        if (!elements.toggleScheduleBtn) return;
        const label = isCollapsed ? i18n.t('showSchedule') : i18n.t('hideSchedule');
        const chevronCollapsed = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        const chevronExpanded  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
        elements.toggleScheduleBtn.innerHTML = `${isCollapsed ? chevronCollapsed : chevronExpanded}<span>${label}</span>`;
        elements.toggleScheduleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    }

    // -------------------------------------------------------------------------
    // Slider helpers
    // -------------------------------------------------------------------------
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
        } else {
            elements.installmentsSlider.min = '3';
            elements.installmentsSlider.max = '420';
            elements.installmentsSlider.step = '1';
            elements.installmentsInput.min = '3';
            elements.installmentsInput.max = '420';
        }
        updateUnitSuffix();
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

    function setCommissionPayment(paymentType) {
        state.commissionPayment = paymentType;
        const isUpfront = paymentType === 'upfront';

        if (elements.commUpfrontBtn) {
            elements.commUpfrontBtn.classList.toggle('active', isUpfront);
            elements.commUpfrontBtn.setAttribute('aria-checked', isUpfront ? 'true' : 'false');
        }
        if (elements.commFinancedBtn) {
            elements.commFinancedBtn.classList.toggle('active', !isUpfront);
            elements.commFinancedBtn.setAttribute('aria-checked', !isUpfront ? 'true' : 'false');
        }

        if (elements.commissionHint) {
            elements.commissionHint.textContent = i18n.t(isUpfront ? 'commHintUpfront' : 'commHintFinanced');
        }

        calculate();
    }

    // -------------------------------------------------------------------------
    // Calculations
    // -------------------------------------------------------------------------
    function calculate() {
        const principal      = parseFloat(elements.amountInput.value) || 0;
        let period           = parseInt(elements.installmentsInput.value, 10) || 1;
        const interestRate   = (parseFloat(elements.interestInput.value) || 0) / 100;
        const commissionRate = (parseFloat(elements.commissionInput.value) || 0) / 100;

        if (principal <= 0 || period <= 0) return;

        const months           = state.unit === 'years' ? period * 12 : period;
        const commissionAmount = principal * commissionRate;

        const hasCommission = commissionAmount > 0;
        if (elements.commissionAmountBadge) {
            elements.commissionAmountBadge.textContent = currencyFormatter.format(commissionAmount);
        }
        if (elements.commissionPaymentGroup) {
            elements.commissionPaymentGroup.style.display = hasCommission ? 'flex' : 'none';
        }

        let financedAmount = principal;
        let upfrontPaid    = 0;

        if (state.commissionPayment === 'financed') {
            financedAmount = principal + commissionAmount;
            upfrontPaid    = 0;
        } else {
            financedAmount = principal;
            upfrontPaid    = commissionAmount;
        }

        let calcResult = null;
        if (state.type === 'stable') {
            calcResult = LoanEngine.calculateAnnuity(financedAmount, interestRate, months);
        } else {
            calcResult = LoanEngine.calculateDecreasing(financedAmount, interestRate, months);
        }

        const totalCost         = calcResult.totalInterest + commissionAmount;
        const totalRepaidOverall = calcResult.totalRepaid + upfrontPaid;

        state.lastResult = {
            principal, financedAmount, upfrontPaid,
            commissionPayment: state.commissionPayment,
            months, period, unit: state.unit,
            interestPercent:    interestRate * 100,
            commissionPercent:  commissionRate * 100,
            commissionAmount, type: state.type,
            firstInstallment:   calcResult.firstInstallment,
            lastInstallment:    calcResult.lastInstallment,
            totalRepaid:        totalRepaidOverall,
            totalInstallmentsRepaid: calcResult.totalRepaid,
            totalInterest:      calcResult.totalInterest,
            totalCost, schedule: calcResult.schedule
        };

        renderResults(state.lastResult);
    }

    function renderResults(result) {
        const fmt       = (v) => currencyFormatter.format(v);
        const isUpfront = result.commissionPayment === 'upfront';
        const hasComm   = result.commissionAmount > 0;

        const commLabel = hasComm
            ? (isUpfront ? i18n.t('commLabelUpfront') : i18n.t('commLabelFinanced'))
            : null;

        // Hero
        if (result.type === 'stable') {
            elements.heroInstallmentLabel.textContent   = i18n.t('heroLabelStable');
            elements.heroInstallmentValue.textContent   = fmt(result.firstInstallment);
            elements.heroInstallmentSubtext.textContent = i18n.t('heroSubStable', result.months, commLabel);
        } else {
            elements.heroInstallmentLabel.textContent   = i18n.t('heroLabelDecreasing');
            elements.heroInstallmentValue.textContent   = fmt(result.firstInstallment);
            elements.heroInstallmentSubtext.textContent = i18n.t('heroSubDecreasing', result.lastInstallment, commLabel, fmt);
        }

        // Metrics
        elements.totalRepayment.textContent = fmt(result.totalRepaid);
        elements.totalCost.textContent      = fmt(result.totalCost);
        elements.principalAmount.textContent = fmt(result.principal);
        elements.commissionCost.textContent  = fmt(result.commissionAmount);

        if (elements.commissionPaymentLabel) {
            elements.commissionPaymentLabel.textContent = commLabel ?? i18n.t('commLabelNone');
        }
        if (elements.principalSubtext) {
            elements.principalSubtext.textContent = (hasComm && !isUpfront)
                ? i18n.t('commLabelPrincipalSub', result.financedAmount, fmt)
                : i18n.t('metricPrincipalSub');
        }

        // Breakdown bar
        const total = result.totalRepaid;
        const pPct  = total > 0 ? (result.principal / total) * 100 : 100;
        const iPct  = total > 0 ? (result.totalInterest / total) * 100 : 0;
        const cPct  = total > 0 ? (result.commissionAmount / total) * 100 : 0;

        elements.barPrincipal.style.width  = `${pPct}%`;
        elements.barInterest.style.width   = `${iPct}%`;
        elements.barCommission.style.width = `${cPct}%`;

        elements.legendPrincipalVal.textContent  = `${fmt(result.principal)} (${percentFormatter.format(pPct)}%)`;
        elements.legendInterestVal.textContent   = `${fmt(result.totalInterest)} (${percentFormatter.format(iPct)}%)`;
        elements.legendCommissionVal.textContent = `${fmt(result.commissionAmount)} (${percentFormatter.format(cPct)}%)`;

        if (elements.scheduleRowsCount) {
            elements.scheduleRowsCount.textContent = i18n.t('scheduleCountFn', result.months);
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
        setTimeout(() => elements.toast.classList.remove('show'), 3000);
    }

    // -------------------------------------------------------------------------
    // Event binding
    // -------------------------------------------------------------------------
    function bindEvents() {
        const syncPairs = [
            { input: elements.amountInput,       slider: elements.amountSlider,       isFloat: false },
            { input: elements.installmentsInput,  slider: elements.installmentsSlider,  isFloat: false },
            { input: elements.interestInput,      slider: elements.interestSlider,      isFloat: true  },
            { input: elements.commissionInput,    slider: elements.commissionSlider,    isFloat: true  }
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

        elements.unitYears.addEventListener('click',  () => setUnit('years'));
        elements.unitMonths.addEventListener('click', () => setUnit('months'));

        elements.tabStable.addEventListener('click',     () => setInstallmentType('stable'));
        elements.tabDecreasing.addEventListener('click', () => setInstallmentType('decreasing'));

        if (elements.commUpfrontBtn) {
            elements.commUpfrontBtn.addEventListener('click', () => setCommissionPayment('upfront'));
        }
        if (elements.commFinancedBtn) {
            elements.commFinancedBtn.addEventListener('click', () => setCommissionPayment('financed'));
        }

        // Amount chips
        document.querySelectorAll('.chip[data-amount]').forEach(chip => {
            chip.addEventListener('click', () => {
                elements.amountInput.value  = chip.getAttribute('data-amount');
                elements.amountSlider.value = chip.getAttribute('data-amount');
                updateSliderFill(elements.amountSlider);
                calculate();
            });
        });

        // Period chips
        document.querySelectorAll('.chip[data-period]').forEach(chip => {
            chip.addEventListener('click', () => {
                const period = parseInt(chip.getAttribute('data-period'), 10);
                const unit   = chip.getAttribute('data-unit') || 'years';
                setUnit(unit);
                elements.installmentsInput.value  = period;
                elements.installmentsSlider.value = period;
                updateSliderFill(elements.installmentsSlider);
                calculate();
            });
        });

        // Schedule accordion
        if (elements.toggleScheduleBtn && elements.scheduleContainer) {
            elements.toggleScheduleBtn.addEventListener('click', () => {
                const isCollapsed = elements.scheduleContainer.classList.contains('collapsed');
                elements.scheduleContainer.classList.toggle('collapsed', !isCollapsed);
                updateToggleScheduleLabel(!isCollapsed);
            });
        }

        // Copy summary
        if (elements.copySummaryBtn) {
            elements.copySummaryBtn.addEventListener('click', async () => {
                if (!state.lastResult) calculate();
                const text = i18n.t('copyTemplate', state.lastResult, (v) => currencyFormatter.format(v));
                try {
                    await navigator.clipboard.writeText(text);
                    showToast(i18n.t('toastCopied'));
                } catch {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    showToast(i18n.t('toastCopied'));
                }
            });
        }

        // Print
        if (elements.printBtn) {
            elements.printBtn.addEventListener('click', () => window.print());
        }

        // Form submit
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
                elements.amountInput.value  = '100000';
                elements.amountSlider.value = '100000';
                updateSliderFill(elements.amountSlider);

                setUnit('years');
                elements.installmentsInput.value  = '5';
                elements.installmentsSlider.value = '5';
                updateSliderFill(elements.installmentsSlider);

                elements.interestInput.value  = '8.5';
                elements.interestSlider.value = '8.5';
                updateSliderFill(elements.interestSlider);

                elements.commissionInput.value  = '0';
                elements.commissionSlider.value = '0';
                updateSliderFill(elements.commissionSlider);

                setCommissionPayment('upfront');
                setInstallmentType('stable');
                calculate();
                showToast(i18n.t('toastReset'));
            });
        }

        // Language toggle
        if (elements.langToggleBtn) {
            elements.langToggleBtn.addEventListener('click', () => {
                const next = i18n.getLang() === 'pl' ? 'en' : 'pl';
                i18n.setLang(next);
                applyTranslations();
            });
        }
    }

    function init() {
        cacheDOM();
        updateInstallmentsSliderLimits();
        bindEvents();
        applyTranslations();
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
