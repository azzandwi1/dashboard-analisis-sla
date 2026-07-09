// Multiselect Dashboard Application Logic (V2 - Exact Percentile & Brand Colors)

let rawData = [];
let filteredRoutes = [];
let currentPage = 1;
const rowsPerPage = 15;

// Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.querySelector('.loading-progress');
const body = document.body;

// Multiselect Instances
let msTahunBulan;
let msRegionAsal, msCabangAsal, msTlcAsal;
let msRegionTujuan, msCabangTujuan, msTlcTujuan;
let msTipeKiriman, msJenisKiriman, msService, msStatusP95;

// Tag Input Variables
let selectedCustomers = [];
const customerInput = document.getElementById('filter-pelanggan');
const customerTagsContainer = document.getElementById('customer-tags-container');

// Simple Filters
const filterMinAwb = document.getElementById('filter-min-awb');
const rangeMinAwbVal = document.getElementById('range-min-awb-val');
const sortSelect = document.getElementById('sort-select');
const limitSelect = document.getElementById('limit-select');
const rangeLimitVal = document.getElementById('range-limit-val');

// Reset Filter Button
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// KPI Elements
const kpiTotalRute = document.getElementById('kpi-total-rute');
const kpiTotalAwb = document.getElementById('kpi-total-awb');
const kpiPerluPenambahan = document.getElementById('kpi-perlu-penambahan');
const kpiPctOverSla = document.getElementById('kpi-pct-over-sla');

// Table Elements
const searchTableInput = document.getElementById('search-table');
const dataTableBody = document.getElementById('data-table-body');
const tableInfo = document.getElementById('table-info');
const paginationButtons = document.getElementById('pagination-buttons');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Global Unique Mappings
let originHierarchy = {};
let destHierarchy = {};
let uniqueTahunBulan = new Set();
let uniqueServices = new Set();
let uniqueTipeKiriman = new Set();
let uniqueJenisKiriman = new Set();
let uniqueCustomers = new Set();

// Class definition for Custom Multiselect Dropdown
class MultiselectDropdown {
    constructor(containerId, placeholder, onChangeCallback) {
        this.container = document.getElementById(containerId);
        this.placeholder = placeholder;
        this.onChange = onChangeCallback;
        this.options = [];
        this.selectedValues = new Set();
        
        this.trigger = this.container.querySelector('.multiselect-trigger');
        this.triggerVal = this.container.querySelector('.multiselect-value');
        this.dropdown = this.container.querySelector('.multiselect-dropdown');
        this.searchInput = this.container.querySelector('.multiselect-search');
        this.optionsContainer = this.container.querySelector('.multiselect-options');
        this.btnSelectAll = this.container.querySelector('.select-all');
        this.btnClearAll = this.container.querySelector('.clear-all');

        this.initEvents();
    }

    initEvents() {
        this.trigger.addEventListener('click', (e) => {
            if (this.trigger.classList.contains('disabled')) return;
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.multiselect-dropdown.show').forEach(el => {
                if (el !== this.dropdown) el.classList.remove('show');
            });
            document.querySelectorAll('.multiselect-trigger.active').forEach(el => {
                if (el !== this.trigger) el.classList.remove('active');
            });

            this.dropdown.classList.toggle('show');
            this.trigger.classList.toggle('active');
            
            if (this.dropdown.classList.contains('show')) {
                this.searchInput.focus();
            }
        });

        this.searchInput.addEventListener('input', () => {
            this.renderOptions();
        });

        this.searchInput.addEventListener('click', (e) => e.stopPropagation());

        this.btnSelectAll.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = this.getFilteredOptions();
            visible.forEach(opt => this.selectedValues.add(opt));
            this.updateTrigger();
            this.renderOptions();
            this.onChange();
        });

        this.btnClearAll.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = this.getFilteredOptions();
            visible.forEach(opt => this.selectedValues.delete(opt));
            this.updateTrigger();
            this.renderOptions();
            this.onChange();
        });
    }

    setOptions(options) {
        this.options = options;
        const newSelected = new Set();
        this.selectedValues.forEach(val => {
            if (options.includes(val)) newSelected.add(val);
        });
        this.selectedValues = newSelected;
        this.searchInput.value = '';
        this.updateTrigger();
        this.renderOptions();
    }

    getFilteredOptions() {
        const query = this.searchInput.value.toLowerCase().trim();
        if (!query) return this.options;
        return this.options.filter(opt => String(opt).toLowerCase().includes(query));
    }

    renderOptions() {
        this.optionsContainer.innerHTML = '';
        const filtered = this.getFilteredOptions();
        
        if (filtered.length === 0) {
            this.optionsContainer.innerHTML = `<div style="padding: 8px 12px; font-size: 0.8rem; color: var(--text-muted);">Tidak ada opsi.</div>`;
            return;
        }

        filtered.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'multiselect-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.selectedValues.has(opt);
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedValues.add(opt);
                } else {
                    this.selectedValues.delete(opt);
                }
                this.updateTrigger();
                this.onChange();
            });

            div.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });

            const span = document.createElement('span');
            span.textContent = opt;

            div.appendChild(checkbox);
            div.appendChild(span);
            this.optionsContainer.appendChild(div);
        });
    }

    updateTrigger() {
        if (this.selectedValues.size === 0) {
            this.triggerVal.textContent = this.placeholder;
            this.triggerVal.style.color = 'var(--text-muted)';
        } else if (this.selectedValues.size === this.options.length && this.options.length > 0) {
            this.triggerVal.textContent = 'Semua Terpilih';
            this.triggerVal.style.color = 'var(--text-primary)';
        } else {
            const arr = Array.from(this.selectedValues);
            this.triggerVal.textContent = arr.join(', ');
            this.triggerVal.style.color = 'var(--text-primary)';
        }
    }

    getSelected() {
        return Array.from(this.selectedValues);
    }

    setSelected(values) {
        this.selectedValues = new Set(values);
        this.updateTrigger();
        this.renderOptions();
    }

    clear() {
        this.selectedValues.clear();
        this.updateTrigger();
        this.renderOptions();
    }

    disable() {
        this.trigger.classList.add('disabled');
        this.trigger.style.opacity = '0.6';
        this.trigger.style.cursor = 'not-allowed';
        this.clear();
    }

    enable() {
        this.trigger.classList.remove('disabled');
        this.trigger.style.opacity = '1';
        this.trigger.style.cursor = 'pointer';
        this.renderOptions();
    }
}

// Document load handler
document.addEventListener('DOMContentLoaded', () => {
    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.multiselect-dropdown.show').forEach(el => {
            el.classList.remove('show');
        });
        document.querySelectorAll('.multiselect-trigger.active').forEach(el => {
            el.classList.remove('active');
        });
    });

    // Mobile Responsive Sidebar Navigation Setup
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    // Create and append overlay backdrop dynamically
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    // Create and append close button inside sidebar header for mobile view
    const sidebarHeader = document.querySelector('.sidebar-header');
    const closeSidebarBtn = document.createElement('button');
    closeSidebarBtn.className = 'close-sidebar-btn';
    closeSidebarBtn.setAttribute('aria-label', 'Close filter menu');
    closeSidebarBtn.innerHTML = `
        <svg style="width:24px; height:24px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    `;
    sidebarHeader.appendChild(closeSidebarBtn);

    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    });

    // Collapsible Guide Handler
    const guideToggleBar = document.getElementById('guide-toggle-bar');
    const guideContent = document.getElementById('guide-content');
    const guideToggleIcon = document.getElementById('guide-toggle-icon');

    if (guideToggleBar && guideContent) {
        guideToggleBar.addEventListener('click', () => {
            const isHidden = window.getComputedStyle(guideContent).display === 'none';
            if (isHidden) {
                guideContent.style.display = 'grid';
                guideToggleIcon.textContent = '[ Tutup ]';
            } else {
                guideContent.style.display = 'none';
                guideToggleIcon.textContent = '[ Buka ]';
            }
        });
    }

    // Toggle Sidebar handler (Desktop collapse)
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Trigger Plotly relayout to fill the new space
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 300); // match transition duration
        });
    }

    // Collapsible Notes Handler
    const notesToggleBar = document.getElementById('notes-toggle-bar');
    const notesContent = document.getElementById('notes-content');
    const notesToggleIcon = document.getElementById('notes-toggle-icon');

    if (notesToggleBar && notesContent) {
        notesToggleBar.addEventListener('click', () => {
            const isHidden = window.getComputedStyle(notesContent).display === 'none';
            if (isHidden) {
                notesContent.style.display = 'flex';
                notesToggleIcon.textContent = '[ Tutup ]';
            } else {
                notesContent.style.display = 'none';
                notesToggleIcon.textContent = '[ Buka ]';
            }
        });
    }

    loadAndDecompressData();
});

// Data Decompression & Parse
function loadAndDecompressData() {
    try {
        loadingProgress.textContent = "Menguraikan data dari memori...";
        
        const binaryString = atob(COMPRESSED_DATA);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        loadingProgress.textContent = "Mendekompresi data GZIP (~224k baris)...";
        
        const decompressed = fflate.decompressSync(bytes);
        const csvText = fflate.strFromU8(decompressed);
        
        loadingProgress.textContent = "Melakukan parsing tabel CSV...";
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function(results) {
                // Parse distribution strings into arrays of {day, count} objects
                rawData = results.data.map(row => {
                    const distStr = row.Distribution;
                    let dist = [];
                    if (distStr && typeof distStr === 'string') {
                        dist = distStr.split(';').map(part => {
                            const [day, count] = part.split(':').map(Number);
                            return { day, count };
                        });
                    }
                    return {
                        ...row,
                        parsedDist: dist
                    };
                });
                
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.visibility = 'hidden';
                }, 500);
                
                setupFilters();
                applyFilters();
            },
            error: function(err) {
                console.error("Error parsing CSV:", err);
                loadingProgress.textContent = "Error parsing data CSV!";
            }
        });
    } catch (e) {
        console.error("Error loading data:", e);
        loadingProgress.textContent = "Gagal memuat data: " + e.message;
    }
}

// Setup Filters and Multiselect Instances
function setupFilters() {
    // 1. Scan for dimensions
    rawData.forEach(row => {
        const regA = row['REGION ASAL'] || '(blank)';
        const cabA = row['CABANG UTAMA ASAL'] || '(blank)';
        const tlcA = row['TLC Asal'] || '(blank)';
        
        if (!originHierarchy[regA]) originHierarchy[regA] = {};
        if (!originHierarchy[regA][cabA]) originHierarchy[regA][cabA] = new Set();
        originHierarchy[regA][cabA].add(tlcA);

        const regT = row['REGION TUJUAN'] || '(blank)';
        const cabT = row['CABANG UTAMA TUJUAN'] || '(blank)';
        const tlcT = row['TLC Tujuan'] || '(blank)';
        
        if (!destHierarchy[regT]) destHierarchy[regT] = {};
        if (!destHierarchy[regT][cabT]) destHierarchy[regT][cabT] = new Set();
        destHierarchy[regT][cabT].add(tlcT);

        if (row['Tahun_Bulan']) uniqueTahunBulan.add(row['Tahun_Bulan']);
        if (row['Service']) uniqueServices.add(row['Service']);
        if (row['Tipe Kiriman']) uniqueTipeKiriman.add(row['Tipe Kiriman']);
        if (row['Jenis Kiriman']) uniqueJenisKiriman.add(row['Jenis Kiriman']);
        if (row['Nama Pelanggan']) uniqueCustomers.add(row['Nama Pelanggan']);
    });

    // 2. Initialize Multiselect Dropdowns
    msTahunBulan = new MultiselectDropdown('ms-tahun-bulan', 'Choose Months', applyFilters);
    msRegionAsal = new MultiselectDropdown('ms-region-asal', 'Choose Regions', () => {
        updateCabangAsalOptions();
        applyFilters();
    });
    msCabangAsal = new MultiselectDropdown('ms-cabang-asal', 'Choose Cabangs', () => {
        updateTlcAsalOptions();
        applyFilters();
    });
    msTlcAsal = new MultiselectDropdown('ms-tlc-asal', 'Choose TLCs', applyFilters);

    msRegionTujuan = new MultiselectDropdown('ms-region-tujuan', 'Choose Regions', () => {
        updateCabangTujuanOptions();
        applyFilters();
    });
    msCabangTujuan = new MultiselectDropdown('ms-cabang-tujuan', 'Choose Cabangs', () => {
        updateTlcTujuanOptions();
        applyFilters();
    });
    msTlcTujuan = new MultiselectDropdown('ms-tlc-tujuan', 'Choose TLCs', applyFilters);

    msTipeKiriman = new MultiselectDropdown('ms-tipe-kiriman', 'Choose Types', applyFilters);
    msJenisKiriman = new MultiselectDropdown('ms-jenis-kiriman', 'Choose Types', applyFilters);
    msService = new MultiselectDropdown('ms-service', 'Choose Services', applyFilters);
    msStatusP95 = new MultiselectDropdown('ms-status-p95', 'Choose Statuses', applyFilters);

    // 3. Populate Multiselects
    msTahunBulan.setOptions(Array.from(uniqueTahunBulan).sort());
    msRegionAsal.setOptions(Object.keys(originHierarchy).sort());
    msRegionTujuan.setOptions(Object.keys(destHierarchy).sort());
    msTipeKiriman.setOptions(Array.from(uniqueTipeKiriman).sort());
    msJenisKiriman.setOptions(Array.from(uniqueJenisKiriman).sort());
    msService.setOptions(Array.from(uniqueServices).sort());
    msStatusP95.setOptions(['SLA Masih Sesuai', 'SLA Terlalu Longgar', 'Perlu Penambahan SLA']);

    // Disable child multiselects initially
    msCabangAsal.disable();
    msTlcAsal.disable();
    msCabangTujuan.disable();
    msTlcTujuan.disable();

    // 4. Customer Tags Event Logic
    const customerDatalist = document.getElementById('pelanggan-list');
    Array.from(uniqueCustomers).sort().forEach(cust => {
        const option = document.createElement('option');
        option.value = cust;
        customerDatalist.appendChild(option);
    });

    customerInput.addEventListener('change', () => {
        const val = customerInput.value.trim();
        if (val && uniqueCustomers.has(val) && !selectedCustomers.includes(val)) {
            selectedCustomers.push(val);
            renderCustomerTags();
            customerInput.value = '';
            applyFilters();
        }
    });

    customerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = customerInput.value.trim();
            if (val && uniqueCustomers.has(val) && !selectedCustomers.includes(val)) {
                selectedCustomers.push(val);
                renderCustomerTags();
                customerInput.value = '';
                applyFilters();
            }
        }
    });

    // 5. Normal inputs listeners
    filterMinAwb.addEventListener('input', () => {
        rangeMinAwbVal.textContent = filterMinAwb.value;
        applyFilters();
    });
    sortSelect.addEventListener('change', applyFilters);
    limitSelect.addEventListener('input', () => {
        rangeLimitVal.textContent = limitSelect.value;
        applyFilters();
    });
    limitSelect.addEventListener('change', applyFilters);

    searchTableInput.addEventListener('input', () => {
        currentPage = 1;
        renderTable();
    });

    resetFiltersBtn.addEventListener('click', resetAllFilters);
    exportCsvBtn.addEventListener('click', exportAggregatedDataToCSV);
}

// Multiselect Hierarchical updates
function updateCabangAsalOptions() {
    const selectedRegions = msRegionAsal.getSelected();
    const availableCabangs = new Set();
    
    selectedRegions.forEach(reg => {
        if (originHierarchy[reg]) {
            Object.keys(originHierarchy[reg]).forEach(cab => availableCabangs.add(cab));
        }
    });
    
    const sortedCabangs = Array.from(availableCabangs).sort();
    msCabangAsal.setOptions(sortedCabangs);
    
    if (selectedRegions.length > 0) {
        msCabangAsal.enable();
    } else {
        msCabangAsal.disable();
        msTlcAsal.disable();
    }
    updateTlcAsalOptions();
}

function updateTlcAsalOptions() {
    const selectedRegions = msRegionAsal.getSelected();
    const selectedCabangs = msCabangAsal.getSelected();
    const availableTlcs = new Set();
    
    selectedRegions.forEach(reg => {
        if (originHierarchy[reg]) {
            selectedCabangs.forEach(cab => {
                if (originHierarchy[reg][cab]) {
                    originHierarchy[reg][cab].forEach(tlc => availableTlcs.add(tlc));
                }
            });
        }
    });

    const sortedTlcs = Array.from(availableTlcs).sort();
    msTlcAsal.setOptions(sortedTlcs);
    
    if (selectedCabangs.length > 0) {
        msTlcAsal.enable();
    } else {
        msTlcAsal.disable();
    }
}

function updateCabangTujuanOptions() {
    const selectedRegions = msRegionTujuan.getSelected();
    const availableCabangs = new Set();
    
    selectedRegions.forEach(reg => {
        if (destHierarchy[reg]) {
            Object.keys(destHierarchy[reg]).forEach(cab => availableCabangs.add(cab));
        }
    });
    
    const sortedCabangs = Array.from(availableCabangs).sort();
    msCabangTujuan.setOptions(sortedCabangs);
    
    if (selectedRegions.length > 0) {
        msCabangTujuan.enable();
    } else {
        msCabangTujuan.disable();
        msTlcTujuan.disable();
    }
    updateTlcTujuanOptions();
}

function updateTlcTujuanOptions() {
    const selectedRegions = msRegionTujuan.getSelected();
    const selectedCabangs = msCabangTujuan.getSelected();
    const availableTlcs = new Set();
    
    selectedRegions.forEach(reg => {
        if (destHierarchy[reg]) {
            selectedCabangs.forEach(cab => {
                if (destHierarchy[reg][cab]) {
                    destHierarchy[reg][cab].forEach(tlc => availableTlcs.add(tlc));
                }
            });
        }
    });

    const sortedTlcs = Array.from(availableTlcs).sort();
    msTlcTujuan.setOptions(sortedTlcs);
    
    if (selectedCabangs.length > 0) {
        msTlcTujuan.enable();
    } else {
        msTlcTujuan.disable();
    }
}

// Render customer tags
function renderCustomerTags() {
    customerTagsContainer.innerHTML = '';
    selectedCustomers.forEach(cust => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            <span>${cust}</span>
            <button class="tag-remove" data-val="${cust}">✕</button>
        `;
        customerTagsContainer.appendChild(tag);
    });

    customerTagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const valToRemove = e.target.getAttribute('data-val');
            selectedCustomers = selectedCustomers.filter(c => c !== valToRemove);
            renderCustomerTags();
            applyFilters();
        });
    });
}

// Reset filters
function resetAllFilters() {
    msTahunBulan.clear();
    msRegionAsal.clear();
    updateCabangAsalOptions();
    
    msRegionTujuan.clear();
    updateCabangTujuanOptions();

    msTipeKiriman.clear();
    msJenisKiriman.clear();
    msService.clear();
    msStatusP95.clear();
    
    selectedCustomers = [];
    renderCustomerTags();
    customerInput.value = "";
    
    filterMinAwb.value = "0";
    rangeMinAwbVal.textContent = "0";
    sortSelect.value = "awb_desc";
    limitSelect.value = "15";
    rangeLimitVal.textContent = "15";
    searchTableInput.value = "";

    applyFilters();
}

// REPLICATES DAX: ROUNDUP(x, 1)
function roundup1(val) {
    return Math.ceil(val * 10) / 10;
}

// REPLICATES DAX: Gap SLA P95
function calculateGap(pctSla, minSla, maxSla) {
    if (pctSla < minSla) {
        return pctSla - minSla;
    } else if (pctSla > maxSla) {
        return pctSla - maxSla;
    }
    return 0;
}

// REPLICATES DAX / Power BI: PERCENTILE.INC directly from aggregated day frequencies
function calculatePercentile(dayCounts, p) {
    const N = dayCounts.reduce((sum, item) => sum + item.count, 0);
    if (N === 0) return 0;
    if (N === 1) return dayCounts[0].day;

    const targetIdx = p * (N - 1);
    const idxFloor = Math.floor(targetIdx);
    const idxCeil = Math.ceil(targetIdx);

    let valFloor = null;
    let valCeil = null;

    let cumSum = 0;
    for (let i = 0; i < dayCounts.length; i++) {
        const item = dayCounts[i];
        const nextCumSum = cumSum + item.count;
        
        if (valFloor === null && idxFloor < nextCumSum) {
            valFloor = item.day;
        }
        if (valCeil === null && idxCeil < nextCumSum) {
            valCeil = item.day;
        }
        
        if (valFloor !== null && valCeil !== null) {
            break;
        }
        cumSum = nextCumSum;
    }

    if (valFloor === null) valFloor = dayCounts[dayCounts.length - 1].day;
    if (valCeil === null) valCeil = dayCounts[dayCounts.length - 1].day;

    // Linear interpolation
    return valFloor + (targetIdx - idxFloor) * (valCeil - valFloor);
}

// CORE ROUTE AGGREGATION & HISTOGRAM SUMMING
function applyFilters() {
    // 1. Get raw filters
    const selTahunBulan = msTahunBulan.getSelected();
    const selRegionsA = msRegionAsal.getSelected();
    const selCabangsA = msCabangAsal.getSelected();
    const selTlcsA = msTlcAsal.getSelected();

    const selRegionsT = msRegionTujuan.getSelected();
    const selCabangsT = msCabangTujuan.getSelected();
    const selTlcsT = msTlcTujuan.getSelected();

    const selTypes = msTipeKiriman.getSelected();
    const selJenis = msJenisKiriman.getSelected();
    const selServices = msService.getSelected();
    const selStatusP95 = msStatusP95.getSelected();
    const minAwb = parseInt(filterMinAwb.value) || 0;

    // 2. Filter raw records
    const matchingRawRows = rawData.filter(row => {
        // Year Month filter
        if (selTahunBulan.length > 0 && !selTahunBulan.includes(row['Tahun_Bulan'])) return false;

        // Origin filters
        if (selRegionsA.length > 0 && !selRegionsA.includes(row['REGION ASAL'])) return false;
        if (selCabangsA.length > 0 && !selCabangsA.includes(row['CABANG UTAMA ASAL'])) return false;
        if (selTlcsA.length > 0 && !selTlcsA.includes(row['TLC Asal'])) return false;

        // Destination filters
        if (selRegionsT.length > 0 && !selRegionsT.includes(row['REGION TUJUAN'])) return false;
        if (selCabangsT.length > 0 && !selCabangsT.includes(row['CABANG UTAMA TUJUAN'])) return false;
        if (selTlcsT.length > 0 && !selTlcsT.includes(row['TLC Tujuan'])) return false;

        // Service, type, jenis, and customer tags
        if (selServices.length > 0 && !selServices.includes(row['Service'])) return false;
        if (selTypes.length > 0 && !selTypes.includes(row['Tipe Kiriman'])) return false;
        if (selJenis.length > 0 && !selJenis.includes(row['Jenis Kiriman'])) return false;
        if (selectedCustomers.length > 0 && !selectedCustomers.includes(row['Nama Pelanggan'])) return false;

        return true;
    });

    // 3. Group by Route: (REGION ASAL, CABANG UTAMA ASAL, TLC Asal) -> (REGION TUJUAN, CABANG UTAMA TUJUAN, TLC Tujuan)
    const groups = {};
    matchingRawRows.forEach(row => {
        const key = `${row['TLC Asal']}->${row['TLC Tujuan']}`;
        if (!groups[key]) {
            groups[key] = {
                regionAsal: row['REGION ASAL'],
                cabangAsal: row['CABANG UTAMA ASAL'],
                tlcAsal: row['TLC Asal'],
                regionTujuan: row['REGION TUJUAN'],
                cabangTujuan: row['CABANG UTAMA TUJUAN'],
                tlcTujuan: row['TLC Tujuan'],
                totalAwb: 0,
                sumMinSla: 0,
                sumMaxSla: 0,
                dayCounts: {} // day_integer -> package_count map
            };
        }
        
        const awb = row['Total AWB'] || 0;
        groups[key].totalAwb += awb;
        groups[key].sumMinSla += (row['Weighted Avg SLA Min'] || 0) * awb;
        groups[key].sumMaxSla += (row['Weighted Avg SLA Max'] || 0) * awb;
        
        // Sum histogram counts
        row.parsedDist.forEach(item => {
            if (!groups[key].dayCounts[item.day]) {
                groups[key].dayCounts[item.day] = 0;
            }
            groups[key].dayCounts[item.day] += item.count;
        });
    });

    // 4. Calculate exact percentiles and SLA min/max roundup values
    let routes = [];
    for (const key in groups) {
        const g = groups[key];
        const awb = g.totalAwb;
        
        // Filter minimal AWB on the route group level
        if (awb < minAwb) continue;

        // SLA Min and Max are weighted and rounded up to 1 decimal place (ROUNDUP(x, 1))
        const minSla = awb > 0 ? roundup1(g.sumMinSla / awb) : 0;
        const maxSla = awb > 0 ? roundup1(g.sumMaxSla / awb) : 0;

        // Convert dayCounts map to sorted array of objects for percentile calculation
        const dayCountsArray = Object.keys(g.dayCounts).map(dayStr => {
            const day = Number(dayStr);
            return { day, count: g.dayCounts[dayStr] };
        }).sort((a, b) => a.day - b.day);

        // Exact percentile calculations (PERCENTILE.INC logic)
        let p90 = 0;
        let p95 = 0;
        if (dayCountsArray.length > 0) {
            p90 = Math.round(calculatePercentile(dayCountsArray, 0.90) * 10) / 10;
            p95 = Math.round(calculatePercentile(dayCountsArray, 0.95) * 10) / 10;
        }

        // Calculate Gap SLA (matching user's exact DAX conditions)
        const gapP90 = calculateGap(p90, minSla, maxSla);
        const gapP95 = calculateGap(p95, minSla, maxSla);

        // Validation status based on Gaps
        const statusP90 = gapP90 > 0 ? 'Perlu Penambahan SLA' : gapP90 < 0 ? 'SLA Terlalu Longgar' : 'SLA Masih Sesuai';
        const statusP95 = gapP95 > 0 ? 'Perlu Penambahan SLA' : gapP95 < 0 ? 'SLA Terlalu Longgar' : 'SLA Masih Sesuai';

        // Filter by aggregated Status Validasi SLA P95
        if (selStatusP95.length > 0 && !selStatusP95.includes(statusP95)) {
            continue;
        }

        routes.push({
            'REGION ASAL': g.regionAsal,
            'CABANG UTAMA ASAL': g.cabangAsal,
            'TLC Asal': g.tlcAsal,
            'REGION TUJUAN': g.regionTujuan,
            'CABANG UTAMA TUJUAN': g.cabangTujuan,
            'TLC Tujuan': g.tlcTujuan,
            'Total AWB': awb,
            'Weighted Avg SLA Min': minSla,
            'Weighted Avg SLA Max': maxSla,
            'P90 SLA Aktual': p90,
            'P95 SLA Aktual': p95,
            'Gap SLA P90': gapP90,
            'Gap SLA P95': gapP95,
            'Status Validasi SLA P90': statusP90,
            'Status Validasi SLA P95': statusP95,
            'dayCounts': g.dayCounts // Save raw dayCounts for global percentile KPIs
        });
    }

    // 5. Sorting routes array
    const sortVal = sortSelect.value;
    routes.sort((a, b) => {
        if (sortVal === 'awb_desc') {
            return b['Total AWB'] - a['Total AWB'];
        } else if (sortVal === 'gap95_desc') {
            return b['Gap SLA P95'] - a['Gap SLA P95'];
        } else if (sortVal === 'p95_desc') {
            return b['P95 SLA Aktual'] - a['P95 SLA Aktual'];
        } else if (sortVal === 'awb_asc') {
            return a['Total AWB'] - b['Total AWB'];
        }
        return 0;
    });

    filteredRoutes = routes;

    // Reset pagination and refresh views
    currentPage = 1;
    updateKpis();
    renderChart();
    renderTable();
}

// KPI renderer
function updateKpis() {
    const totalRute = filteredRoutes.length;
    
    let totalAwbVal = 0;
    let needsSlaAddition = 0;
    const globalDayCounts = {};

    filteredRoutes.forEach(route => {
        totalAwbVal += route['Total AWB'] || 0;
        if (route['Status Validasi SLA P95'] === 'Perlu Penambahan SLA') {
            needsSlaAddition++;
        }
        
        // Sum day counts across all filtered routes
        if (route.dayCounts) {
            for (const day in route.dayCounts) {
                if (!globalDayCounts[day]) {
                    globalDayCounts[day] = 0;
                }
                globalDayCounts[day] += route.dayCounts[day];
            }
        }
    });

    // Compute global P95 over all combined filtered shipments (AWB-level)
    const globalDayCountsArray = Object.keys(globalDayCounts).map(dayStr => {
        const day = Number(dayStr);
        return { day, count: globalDayCounts[day] };
    }).sort((a, b) => a.day - b.day);

    let globalP95 = 0;
    if (globalDayCountsArray.length > 0) {
        globalP95 = Math.round(calculatePercentile(globalDayCountsArray, 0.95) * 10) / 10;
    }

    kpiTotalRute.textContent = totalRute.toLocaleString('id-ID');
    kpiTotalAwb.textContent = totalAwbVal.toLocaleString('id-ID');
    kpiPerluPenambahan.textContent = needsSlaAddition.toLocaleString('id-ID');
    kpiPctOverSla.textContent = globalP95 > 0 ? `${globalP95.toFixed(1)} hari` : "0.0 hari";

    // Warnings (only toggle on the warning count card now)
    const warningCard = kpiPerluPenambahan.closest('.kpi-card');
    if (needsSlaAddition > 0) {
        warningCard.classList.add('warning');
    } else {
        warningCard.classList.remove('warning');
    }
}

// Plotly range chart renderer
// Plotly range chart renderer
function renderChart() {
    const limit = parseInt(limitSelect.value) || 15;
    
    // Reset scroll container viewport to top on redraw
    const scrollContainer = document.querySelector('.chart-scroll-container');
    if (scrollContainer) {
        scrollContainer.scrollTop = 0;
    }
    
    const chartData = filteredRoutes.slice(0, limit);
    chartData.reverse(); // Bottom to top rendering

    if (chartData.length === 0) {
        Plotly.purge('sla-chart');
        document.getElementById('sla-chart').innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-muted);">Tidak ada data untuk rute yang dipilih.</div>`;
        document.getElementById('sla-chart-xaxis').style.display = 'none';
        return;
    } else {
        // Clear custom message to prevent Plotly state corruption
        const chartDiv = document.getElementById('sla-chart');
        if (chartDiv && !chartDiv.querySelector('.plot-container')) {
            Plotly.purge('sla-chart');
            chartDiv.innerHTML = '';
        }
        document.getElementById('sla-chart-xaxis').style.display = 'block';
    }

    const routeLabels = chartData.map(row => `${row['TLC Asal']} → ${row['TLC Tujuan']}`);
    const minSlas = chartData.map(row => row['Weighted Avg SLA Min']);
    const maxSlas = chartData.map(row => row['Weighted Avg SLA Max']);
    const p90s = chartData.map(row => row['P90 SLA Aktual']);
    const p95s = chartData.map(row => row['P95 SLA Aktual']);

    // Calculate synchronized X-Axis range based on values to ensure alignment
    const maxVal = Math.max(
        ...minSlas,
        ...maxSlas,
        ...p90s,
        ...p95s,
        5 // fallback min of 5 days
    );
    const xRange = [0, Math.ceil(maxVal * 1.1)]; // 10% padding, rounded up

    // Hover texts showing both percentiles for robust comparison
    const hoverTextP90 = chartData.map(row => 
        `<b>Rute:</b> ${row['TLC Asal']} (${row['CABANG UTAMA ASAL']}) → ${row['TLC Tujuan']} (${row['CABANG UTAMA TUJUAN']})<br>` +
        `<b>Total AWB:</b> ${row['Total AWB'].toLocaleString('id-ID')}<br>` +
        `<b>SLA:</b> ${row['Weighted Avg SLA Min']} - ${row['Weighted Avg SLA Max']} hari<br>` +
        `<b>P90 Aktual:</b> ${row['P90 SLA Aktual']} hari (Gap: ${row['Gap SLA P90'].toFixed(1)} hari) [${row['Status Validasi SLA P90']}]<br>` +
        `<b>P95 Aktual:</b> ${row['P95 SLA Aktual']} hari (Gap: ${row['Gap SLA P95'].toFixed(1)} hari) [${row['Status Validasi SLA P95']}]`
    );

    const hoverTextP95 = chartData.map(row => 
        `<b>Rute:</b> ${row['TLC Asal']} (${row['CABANG UTAMA ASAL']}) → ${row['TLC Tujuan']} (${row['CABANG UTAMA TUJUAN']})<br>` +
        `<b>Total AWB:</b> ${row['Total AWB'].toLocaleString('id-ID')}<br>` +
        `<b>SLA:</b> ${row['Weighted Avg SLA Min']} - ${row['Weighted Avg SLA Max']} hari<br>` +
        `<b>P90 Aktual:</b> ${row['P90 SLA Aktual']} hari (Gap: ${row['Gap SLA P90'].toFixed(1)} hari) [${row['Status Validasi SLA P90']}]<br>` +
        `<b>P95 Aktual:</b> ${row['P95 SLA Aktual']} hari (Gap: ${row['Gap SLA P95'].toFixed(1)} hari) [${row['Status Validasi SLA P95']}]`
    );

    // Plotly traces
    const traceSlaRange = {
        x: maxSlas.map((max, idx) => max - minSlas[idx]),
        base: minSlas,
        y: routeLabels,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: 'rgba(134, 40, 128, 0.15)', // Light Brand Primary (Plum)
            line: {
                color: 'rgba(134, 40, 128, 0.4)', // Brand Primary border
                width: 1
            }
        },
        name: 'Rentang SLA',
        hoverinfo: 'skip',
        showlegend: false
    };

    const traceP90 = {
        x: p90s,
        y: routeLabels,
        type: 'scatter',
        mode: 'markers',
        marker: {
            color: '#10b981', // Standard green for P90
            size: 14, // Larger size to prevent being hidden under P95
            symbol: 'circle',
            line: {
                color: '#ffffff',
                width: 1.5
            }
        },
        name: 'P90 SLA Aktual (Weighted)',
        text: hoverTextP90,
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: '#10b981',
            font: {
                family: 'Outfit, sans-serif',
                size: 12,
                color: '#ffffff' // White text for maximum contrast
            }
        },
        showlegend: false
    };

    const traceP95 = {
        x: p95s,
        y: routeLabels,
        type: 'scatter',
        mode: 'markers',
        marker: {
            color: '#EE6825', // Brand Accent Orange for P95 (Warning/Alert)
            size: 8, // Smaller size so it sits neatly inside the P90 circle if equal
            symbol: 'diamond',
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        name: 'P95 SLA Aktual (Weighted)',
        text: hoverTextP95,
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: '#EE6825',
            font: {
                family: 'Outfit, sans-serif',
                size: 12,
                color: '#ffffff' // White text for maximum contrast
            }
        },
        showlegend: false
    };

    // Main scrollable plot layout (margins minimized, x-axis ticks hidden, grids visible)
    const layout = {
        barmode: 'overlay',
        margin: { l: 120, r: 40, t: 10, b: 10 }, 
        height: Math.max(400, chartData.length * 30),
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {
            range: xRange,
            gridcolor: '#D7D9DE',
            tickcolor: 'rgba(0,0,0,0)', 
            showticklabels: false, // HIDE TICK LABELS
            zeroline: false
        },
        yaxis: {
            gridcolor: 'rgba(0,0,0,0)',
            tickcolor: '#D7D9DE',
            font: { color: '#1D1D1F', size: 11 }
        },
        showlegend: false,
        hovermode: 'closest'
    };

    // Static Bottom X-Axis plot layout (margins aligned, y-axis completely hidden)
    const layoutXAxis = {
        margin: { l: 120, r: 40, t: 0, b: 35 },
        height: 50,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {
            range: xRange,
            gridcolor: 'rgba(0,0,0,0)', // hide duplicate grids
            tickcolor: '#5F6368',
            font: { color: '#5F6368', size: 10 },
            title: {
                text: 'Waktu Pengiriman (Hari)',
                font: { color: '#5F6368', size: 11, weight: '500' }
            },
            zeroline: false
        },
        yaxis: {
            visible: false
        },
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: false, // hide floating buttons for clean look
        displaylogo: false
    };

    // Update main chart container height and plot
    const chartDiv = document.getElementById('sla-chart');
    if (chartDiv) {
        chartDiv.style.height = `${layout.height}px`;
    }
    Plotly.newPlot('sla-chart', [traceSlaRange, traceP90, traceP95], layout, config);

    // Plot empty trace in bottom container to render static x-axis ticks
    Plotly.newPlot('sla-chart-xaxis', [], layoutXAxis, config);
}

// Table rendering (V2 - 15 columns)
function renderTable() {
    const query = searchTableInput.value.toLowerCase().trim();
    
    let searchData = filteredRoutes;
    if (query) {
        searchData = filteredRoutes.filter(row => 
            row['TLC Asal'].toLowerCase().includes(query) ||
            row['TLC Tujuan'].toLowerCase().includes(query) ||
            row['CABANG UTAMA ASAL'].toLowerCase().includes(query) ||
            row['CABANG UTAMA TUJUAN'].toLowerCase().includes(query) ||
            row['REGION ASAL'].toLowerCase().includes(query) ||
            row['REGION TUJUAN'].toLowerCase().includes(query)
        );
    }

    const totalRecords = searchData.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRecords);
    const pageData = searchData.slice(startIdx, endIdx);

    dataTableBody.innerHTML = '';
    
    if (pageData.length === 0) {
        dataTableBody.innerHTML = `<tr><td colspan="15" style="text-align:center; color:var(--text-muted); padding: 24px;">Tidak ada data yang ditemukan.</td></tr>`;
        tableInfo.textContent = "Showing 0 to 0 of 0 entries";
        paginationButtons.innerHTML = '';
        return;
    }

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        
        // P95 badge: danger if Perlu Penambahan SLA, warning if SLA Terlalu Longgar, else success
        const badgeClassP95 = row['Status Validasi SLA P95'] === 'Perlu Penambahan SLA' ? 'danger' :
                              row['Status Validasi SLA P95'] === 'SLA Terlalu Longgar' ? 'warning' : 'success';
                              
        const badgeClassP90 = row['Status Validasi SLA P90'] === 'Perlu Penambahan SLA' ? 'danger' :
                              row['Status Validasi SLA P90'] === 'SLA Terlalu Longgar' ? 'warning' : 'success';

        tr.innerHTML = `
            <td>${row['REGION ASAL']}</td>
            <td>${row['CABANG UTAMA ASAL']}</td>
            <td><strong>${row['TLC Asal']}</strong></td>
            <td>${row['REGION TUJUAN']}</td>
            <td>${row['CABANG UTAMA TUJUAN']}</td>
            <td><strong>${row['TLC Tujuan']}</strong></td>
            <td style="text-align:right;">${row['Total AWB'].toLocaleString('id-ID')}</td>
            <td style="text-align:center;">${row['Weighted Avg SLA Min'].toFixed(1)}</td>
            <td style="text-align:center;">${row['Weighted Avg SLA Max'].toFixed(1)}</td>
            <td style="text-align:center;">${row['P90 SLA Aktual'].toFixed(1)}</td>
            <td style="text-align:center;">${row['P95 SLA Aktual'].toFixed(1)}</td>
            <td style="text-align:center; font-weight:500; color:${row['Gap SLA P90'] > 0 ? '#ef4444' : row['Gap SLA P90'] < 0 ? '#EE6825' : 'inherit'}">${row['Gap SLA P90'] > 0 ? '+' : ''}${row['Gap SLA P90'].toFixed(1)}</td>
            <td style="text-align:center; font-weight:500; color:${row['Gap SLA P95'] > 0 ? '#ef4444' : row['Gap SLA P95'] < 0 ? '#EE6825' : 'inherit'}">${row['Gap SLA P95'] > 0 ? '+' : ''}${row['Gap SLA P95'].toFixed(1)}</td>
            <td><span class="badge ${badgeClassP90}">${row['Status Validasi SLA P90']}</span></td>
            <td><span class="badge ${badgeClassP95}">${row['Status Validasi SLA P95']}</span></td>
        `;
        dataTableBody.appendChild(tr);
    });

    tableInfo.textContent = `Showing ${(startIdx + 1)} to ${endIdx} of ${totalRecords} entries`;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    paginationButtons.innerHTML = '';
    const maxVisiblePages = 5;
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        currentPage--;
        renderTable();
    });
    paginationButtons.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        addPageBtn(1);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.margin = '0 4px';
            paginationButtons.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageBtn(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.margin = '0 4px';
            paginationButtons.appendChild(dots);
        }
        addPageBtn(totalPages);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        currentPage++;
        renderTable();
    });
    paginationButtons.appendChild(nextBtn);
}

function addPageBtn(pageNumber) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNumber === currentPage ? 'active' : ''}`;
    btn.textContent = pageNumber;
    btn.addEventListener('click', () => {
        currentPage = pageNumber;
        renderTable();
    });
    paginationButtons.appendChild(btn);
}

// Export aggregated route list directly to CSV download
function exportAggregatedDataToCSV() {
    if (filteredRoutes.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    const headers = [
        "REGION ASAL", "CABANG UTAMA ASAL", "TLC Asal",
        "REGION TUJUAN", "CABANG UTAMA TUJUAN", "TLC Tujuan",
        "Total AWB", "Weighted Avg SLA Min", "Weighted Avg SLA Max",
        "P90 SLA Aktual", "P95 SLA Aktual", "Gap SLA P90", "Gap SLA P95",
        "Status Validasi SLA P90", "Status Validasi SLA P95"
    ];

    // Helper to format array selections safely for CSV values
    const formatFilterValue = (selectedArr) => {
        if (selectedArr.length === 0) return "Semua";
        let valStr = selectedArr.join("; ");
        if (valStr.includes(",") || valStr.includes('"') || valStr.includes("\n")) {
            valStr = '"' + valStr.replace(/"/g, '""') + '"';
        }
        return valStr;
    };

    const getSortText = (val) => {
        if (val === 'awb_desc') return "Total AWB terbesar";
        if (val === 'gap95_desc') return "Gap SLA P95 terbesar";
        if (val === 'p95_desc') return "P95 SLA Aktual terbesar";
        if (val === 'awb_asc') return "Total AWB terkecil";
        return val;
    };

    let csvContent = "\ufeff";
    csvContent += `FILTER YANG DITERAPKAN,\n`;
    csvContent += `Tahun Bulan,${formatFilterValue(msTahunBulan.getSelected())}\n`;
    csvContent += `Region Asal,${formatFilterValue(msRegionAsal.getSelected())}\n`;
    csvContent += `Cabang Utama Asal,${formatFilterValue(msCabangAsal.getSelected())}\n`;
    csvContent += `TLC Asal,${formatFilterValue(msTlcAsal.getSelected())}\n`;
    csvContent += `Region Tujuan,${formatFilterValue(msRegionTujuan.getSelected())}\n`;
    csvContent += `Cabang Utama Tujuan,${formatFilterValue(msCabangTujuan.getSelected())}\n`;
    csvContent += `TLC Tujuan,${formatFilterValue(msTlcTujuan.getSelected())}\n`;
    csvContent += `Tipe Kiriman,${formatFilterValue(msTipeKiriman.getSelected())}\n`;
    csvContent += `Jenis Kiriman,${formatFilterValue(msJenisKiriman.getSelected())}\n`;
    csvContent += `Service Layanan,${formatFilterValue(msService.getSelected())}\n`;
    
    let customerVal = "Semua";
    if (selectedCustomers.length > 0) {
        let custStr = selectedCustomers.join("; ");
        if (custStr.includes(",") || custStr.includes('"') || custStr.includes("\n")) {
            custStr = '"' + custStr.replace(/"/g, '""') + '"';
        }
        customerVal = custStr;
    }
    csvContent += `Nama Pelanggan,${customerVal}\n`;
    csvContent += `Status Validasi SLA P95,${formatFilterValue(msStatusP95.getSelected())}\n`;
    csvContent += `Minimal Total AWB,${filterMinAwb.value}\n`;
    csvContent += `Urutkan Berdasarkan,${getSortText(sortSelect.value)}\n`;
    csvContent += `\n`; // Empty row separator
    
    csvContent += headers.join(",") + "\n";

    filteredRoutes.forEach(row => {
        const rowData = [
            row['REGION ASAL'], row['CABANG UTAMA ASAL'], row['TLC Asal'],
            row['REGION TUJUAN'], row['CABANG UTAMA TUJUAN'], row['TLC Tujuan'],
            row['Total AWB'], row['Weighted Avg SLA Min'], row['Weighted Avg SLA Max'],
            row['P90 SLA Aktual'], row['P95 SLA Aktual'], row['Gap SLA P90'].toFixed(1), row['Gap SLA P95'].toFixed(1),
            row['Status Validasi SLA P90'], row['Status Validasi SLA P95']
        ];

        const formattedRow = rowData.map(val => {
            if (val === undefined || val === null) return "";
            let valStr = String(val);
            if (valStr.includes(",") || valStr.includes('"') || valStr.includes("\n")) {
                valStr = '"' + valStr.replace(/"/g, '""') + '"';
            }
            return valStr;
        });

        csvContent += formattedRow.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SLA_Aggregated_Report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
