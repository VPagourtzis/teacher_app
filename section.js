const STORAGE_KEY = "teacherAppYears";

const parameters = new URLSearchParams(window.location.search);
const yearId = parameters.get("yearId");
const sectionId = parameters.get("sectionId");

const sectionTitle = document.getElementById("section-title");
const yearTitle = document.getElementById("year-title");

let years = loadYears();
let year = years.find(currentYear => currentYear.id === yearId);
let section = year?.sections.find(currentSection => currentSection.id === sectionId);

if (!year || !section) {
  alert("Το τμήμα δεν βρέθηκε.");
  window.location.href = "index.html";
}

const studentDialog = document.getElementById("student-dialog");
const studentForm = document.getElementById("student-form");
const studentNameInput = document.getElementById("student-name");
const studentError = document.getElementById("student-error");
const studentExcelFileInput = document.getElementById("student-excel-file");
const studentImportStatus = document.getElementById("student-import-status");
const itemDialog = document.getElementById("item-dialog");
const itemForm = document.getElementById("item-form");
const itemTitleInput = document.getElementById("item-title");
const itemTitleField = document.getElementById("item-title-field");
const workingDateInput = document.getElementById("working-date");
const showAllDatesButton = document.getElementById("show-all-dates-button");
const dateFilterDescription = document.getElementById("date-filter-description");
const yearSelector = document.getElementById("year-selector");
const sectionSelector = document.getElementById("section-selector");
const itemTypeInput = document.getElementById("item-type");
const itemTypeField = document.getElementById("item-type-field");
const itemTypeOptions = document.getElementById("item-type-options");
const studentDetailsDialog = document.getElementById("student-details-dialog");
const studentDetailsTitle = document.getElementById("student-details-title");
const studentDetailsSummary = document.getElementById("student-details-summary");
const studentDetailsBody = document.getElementById("student-details-body");
const itemDialogTitle = document.getElementById("item-dialog-title");
const itemError = document.getElementById("item-error");
const itemMaxScoreField = document.getElementById("item-max-score-field");
const itemMaxScoreInput = document.getElementById("item-max-score");
const itemExerciseCountField = document.getElementById("item-exercise-count-field");
const itemExerciseCountInput = document.getElementById("item-exercise-count");
const saveItemButton = document.getElementById("save-item-button");
const editStudentNameButton = document.getElementById("edit-student-name-button");
const editStudentDialog = document.getElementById("edit-student-dialog");
const editStudentForm = document.getElementById("edit-student-form");
const editStudentNameInput = document.getElementById("edit-student-name");
const editStudentError = document.getElementById("edit-student-error");
const cancelEditStudentButton = document.getElementById("cancel-edit-student-button");

let activeItemCategory = null;
let editingRecordId = null;
let selectedStudentId = null;

workingDateInput.value = "";

if (year && section) {
  initialiseSectionData();
  sectionTitle.textContent = section.name;
  yearTitle.textContent = `Σχολική χρονιά: ${year.name}`;
  document.title = `${section.name} - ${year.name}`;
  initialiseHistoryNavigation();
  updateDateFilterInterface();
  renderAll();
}

workingDateInput.addEventListener("change", () => {
  updateDateFilterInterface();
  renderAll();
});

showAllDatesButton.addEventListener("click", () => {
  workingDateInput.value = "";
  updateDateFilterInterface();
  renderAll();
});

for (const button of document.querySelectorAll(".tab-button")) {
  button.addEventListener("click", () => openTab(button.dataset.tab));
}

document.getElementById("add-student-button").addEventListener("click", () => {
  studentForm.reset();
  studentError.textContent = "";
  studentImportStatus.textContent = "";
  studentImportStatus.className = "student-import-status";
  studentDialog.showModal();
  studentNameInput.focus();
});

document.getElementById("cancel-student-button").addEventListener("click", () => {
  studentDialog.close();
});

studentExcelFileInput.addEventListener("change", async () => {
  const file = studentExcelFileInput.files?.[0];

  if (!file) return;

  studentImportStatus.textContent = "Γίνεται ανάγνωση του αρχείου…";
  studentImportStatus.className = "student-import-status";

  try {
    const result = await importStudentsFromExcel(file);

    studentImportStatus.classList.add("success");
    studentImportStatus.textContent =
      `Προστέθηκαν ${result.added} μαθητές.` +
      (result.duplicates > 0 ? ` Παραλείφθηκαν ${result.duplicates} διπλότυπα.` : "");

    if (result.added > 0) {
      renderAll();
    }
  } catch (error) {
    console.error(error);
    studentImportStatus.classList.add("error");
    studentImportStatus.textContent = error.message || "Δεν ήταν δυνατή η εισαγωγή του αρχείου.";
  } finally {
    studentExcelFileInput.value = "";
  }
});

studentForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = studentNameInput.value.trim();

  if (!name) {
    studentError.textContent = "Το όνομα του μαθητή δεν μπορεί να είναι κενό";
    return;
  }

  if (section.students.some(student => student.name.toLocaleLowerCase("el") === name.toLocaleLowerCase("el"))) {
    studentError.textContent = "Ο μαθητής υπάρχει ήδη στο τμήμα";
    return;
  }

  section.students.push(createEmptyStudent(name));

  saveYears();
  studentDialog.close();
  renderAll();
});

editStudentNameButton.addEventListener("click", function () {
    const student = section.students.find(item => item.id === selectedStudentId);

    if (!student) {
      return;
    }

    editStudentError.textContent = "";
    editStudentNameInput.value = student.name;

    editStudentDialog.showModal();

    editStudentNameInput.focus();
    editStudentNameInput.select();
  }
);

cancelEditStudentButton.addEventListener("click", function () {
    editStudentDialog.close();
  }
);

editStudentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const newName = editStudentNameInput.value.trim();
    if (!newName) {
      editStudentError.textContent = "Το όνομα δεν μπορεί να είναι κενό.";
      return;
    }

    const student = section.students.find(
      item => item.id === selectedStudentId
    );

    if (!student) {
      editStudentError.textContent = "Ο μαθητής δεν βρέθηκε.";
      return;
    }

    const duplicateStudent = section.students.some(item => item.id !== selectedStudentId && item.name.toLocaleLowerCase("el") === newName.toLocaleLowerCase("el"));

    if (duplicateStudent) { editStudentError.textContent = "Υπάρχει ήδη μαθητής με αυτό το όνομα.";
      return;
    }

    student.name = newName;

    saveYears();
    renderAll();

    studentDetailsTitle.textContent = newName;

    editStudentDialog.close();
  }
);

for (const button of document.querySelectorAll("[data-add-item]")) {
  button.addEventListener("click", () => {
    const category = button.dataset.addItem;

    if (category === "absences" || category === "participation") {
      addDatedRecord(category);
      return;
    }

    openItemDialog(category);
  });
}

document.getElementById("cancel-item-button").addEventListener("click", () => {
    editingRecordId = null;
    activeItemCategory = null;
    itemDialog.close();
});

document.getElementById("close-student-details-button").addEventListener("click", () => {
    selectedStudentId = null;
    studentDetailsDialog.close();
  });

itemForm.addEventListener("submit", event => {
  
  event.preventDefault();

  const selectedDate = workingDateInput.value;
  const existingRecord = editingRecordId !== null
    ? section.records[activeItemCategory].find(item => item.id === editingRecordId)
    : null;
  const effectiveDate = selectedDate || (existingRecord ? getRecordDate(existingRecord) : "");
  const title = activeItemCategory === "exams"
    ? itemTitleInput.value.trim()
    : (existingRecord?.title || formatDateForDisplay(effectiveDate));
  const type = itemTypeInput.value.trim();

  let maxScore = null;
  let maxExercises = null;

  if (activeItemCategory === "exams") {
    const rawMaxScore = itemMaxScoreInput.value.trim().replace(",", ".");
    maxScore = Number(rawMaxScore);
  }

  if (activeItemCategory === "exercises") {
    maxExercises = Number(itemExerciseCountInput.value);

    if (!Number.isInteger(maxExercises) || maxExercises < 1) {
      itemError.textContent = "Το πλήθος ασκήσεων πρέπει να είναι μεγαλύτερο του 0.";
      return;
    }

    const normalizedType = type.toLocaleLowerCase("el");
    const duplicateExercise = section.records.exercises.some(record =>
      record.id !== editingRecordId &&
      getRecordDate(record) === effectiveDate &&
      String(record.type || "").trim().toLocaleLowerCase("el") === normalizedType
    );

    if (duplicateExercise) {
      itemError.textContent = "Υπάρχει ήδη καταχώριση ασκήσεων αυτού του τύπου για την ημερομηνία.";
      return;
    }
  }

  if (editingRecordId !== null) {
    const record = section.records[activeItemCategory].find(item => item.id === editingRecordId);

    if (!record) {
      itemError.textContent = "Η καταχώριση δεν βρέθηκε.";
      return;
    }

    if (activeItemCategory === "exams") {
      const highestExistingGrade = getHighestExamGrade(editingRecordId);

      if (highestExistingGrade !== null && maxScore < highestExistingGrade) {
        itemError.textContent = `Υπάρχει ήδη βαθμός ${formatNumber(highestExistingGrade)}. Το μέγιστο δεν μπορεί να γίνει μικρότερο.`;
        return;
      }
    }

    record.title = title;

    record.type = activeItemCategory === "exams" || activeItemCategory === "exercises" ? type : "";

    if (activeItemCategory === "exams") {
      record.maxScore = maxScore;
    }

    if (activeItemCategory === "exercises") {
      const highestExistingValue = getHighestExerciseValue(editingRecordId);

      if (highestExistingValue !== null && maxExercises < highestExistingValue) {
        itemError.textContent = `Υπάρχει ήδη μαθητής με ${highestExistingValue} ασκήσεις. Το πλήθος δεν μπορεί να γίνει μικρότερο.`;
        return;
      }

      record.maxExercises = maxExercises;
    }

  } else {
    const newRecord = {id: createId(), title: title, type: activeItemCategory === "exams" || activeItemCategory === "exercises" ? type : ""};
    if (activeItemCategory === "exams") {
      newRecord.maxScore = maxScore;
    }
    if (activeItemCategory === "exercises") {
      newRecord.maxExercises = maxExercises;
      newRecord.date = effectiveDate;
    }
    section.records[activeItemCategory].push(newRecord);
  }

  saveYears();

  itemDialog.close();

  editingRecordId = null;
  activeItemCategory = null;

  renderAll();
});

function initialiseSectionData() {

  const now = new Date().toISOString();

  if (!year.createdAt) {
    year.createdAt = now;
  }

  if (!year.updatedAt) {
    year.updatedAt = year.createdAt;
  }

  if (!section.createdAt) {
    section.createdAt = now;
  }

  if (!section.updatedAt) {
    section.updatedAt = section.createdAt;
  }

  if (!Array.isArray(section.students)) section.students = [];
  if (!section.records || typeof section.records !== "object") section.records = {};

  for (const category of ["absences", "exams", "exercises", "participation"]) {
    if (!Array.isArray(section.records[category])) section.records[category] = [];

    for (const record of section.records[category]) {
      if (typeof record.hidden !== "boolean") record.hidden = false;
    }
  }
  
  for (const examRecord of section.records.exams) {
    if (!Number.isFinite(Number(examRecord.maxScore)) || Number(examRecord.maxScore) <= 0) {
      examRecord.maxScore = 20;
    }
  }

  for (const exerciseRecord of section.records.exercises) {
    if (!Number.isInteger(Number(exerciseRecord.maxExercises)) || Number(exerciseRecord.maxExercises) < 1) {
      exerciseRecord.maxExercises = 1;
    }
  }

  for (const student of section.students) {
    for (const category of ["absences", "exams", "exercises", "participation"]) {
      if (!student[category] || typeof student[category] !== "object" || Array.isArray(student[category])) {
        student[category] = {};
      }
    }

    for (const record of section.records.exercises) {
      if (student.exercises[record.id] === "yes") student.exercises[record.id] = 1;
      if (student.exercises[record.id] === "no") student.exercises[record.id] = 0;
    }
  }

  if (!Array.isArray(section.hiddenStatisticsColumns)) {
    section.hiddenStatisticsColumns = [];
  }


  saveYears(false);
}

function openTab(tabName) {
  for (const button of document.querySelectorAll(".tab-button")) {
    button.classList.toggle("active", button.dataset.tab === tabName);
  }

  for (const panel of document.querySelectorAll(".tab-panel")) {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  }
}

function openItemDialog(category) {
  if (category === "exercises") {
    const dateValue = workingDateInput.value;
    if (!dateValue) {
      alert("Επιλέξτε συγκεκριμένη ημερομηνία από το ημερολόγιο.");
      workingDateInput.focus();
      return;
    }

  }

  activeItemCategory = category;
  editingRecordId = null;

  itemForm.reset();
  itemError.textContent = "";
  saveItemButton.textContent = "Προσθήκη";

  const settings = {
    exams: {
      title: "Νέο γραπτό",
      placeholder: "π.χ. 1ο τεστ",
      showTitle: true,
      showType: true,
      showMaxScore: true,
      showExerciseCount: false
    },
    exercises: {
      title: `Νέα καταχώριση ασκήσεων — ${formatDateForDisplay(workingDateInput.value)}`,
      placeholder: "",
      showTitle: false,
      showType: true,
      showMaxScore: false,
      showExerciseCount: true
    }
  };

  const setting = settings[category];
  if (!setting) return;

  itemDialogTitle.textContent = setting.title;
  itemTitleInput.placeholder = setting.placeholder;
  itemTitleField.hidden = !setting.showTitle;
  itemTypeField.hidden = !setting.showType;
  itemMaxScoreField.hidden = !setting.showMaxScore;
  itemExerciseCountField.hidden = !setting.showExerciseCount;

  populateTypeOptions(category);
  itemTypeInput.value = "";

  if (category === "exams") itemMaxScoreInput.value = "20";
  if (category === "exercises") itemExerciseCountInput.value = "1";

  itemDialog.showModal();
  (setting.showTitle ? itemTitleInput : itemExerciseCountInput).focus();
}

function addDatedRecord(category) {
  const dateValue = workingDateInput.value;

  if (!dateValue) {
    alert("Επιλέξτε συγκεκριμένη ημερομηνία από το ημερολόγιο.");
    workingDateInput.focus();
    return;
  }

  const duplicate = section.records[category].some(record =>
    record.date === dateValue || record.title === formatDateForDisplay(dateValue)
  );

  if (duplicate) {
    alert("Υπάρχει ήδη καταχώριση για αυτή την ημερομηνία.");
    return;
  }

  section.records[category].push({
    id: createId(),
    title: formatDateForDisplay(dateValue),
    date: dateValue,
    type: ""
  });

  saveYears();
  renderAll();
}

function openEditRecordDialog(category, recordId) {
  const record = section.records[category].find(item => item.id === recordId);

  if (!record) {
    return;
  }

  activeItemCategory = category;
  editingRecordId = recordId;

  itemForm.reset();
  itemError.textContent = "";
  saveItemButton.textContent = "Αποθήκευση αλλαγών";

  const settings = {
    exams: {title: "Επεξεργασία γραπτού", showTitle: true, showType: true, showMaxScore: true, showExerciseCount: false},
    exercises: {title: `Επεξεργασία ασκήσεων — ${record.title || ""}`, showTitle: false, showType: true, showMaxScore: false, showExerciseCount: true}
  };

  const setting = settings[category];

  if (!setting) return;

  itemDialogTitle.textContent = setting.title;
  itemTitleField.hidden = !setting.showTitle;
  itemTypeField.hidden = !setting.showType;
  itemMaxScoreField.hidden = !setting.showMaxScore;
  itemExerciseCountField.hidden = !setting.showExerciseCount;

  populateTypeOptions(category);

  itemTitleInput.value = record.title || "";
  itemTypeInput.value = record.type || "";

  if (category === "exams") {
    itemMaxScoreInput.value = String(record.maxScore ?? 20);
  }
  if (category === "exercises") {
    itemExerciseCountInput.value = String(record.maxExercises ?? 1);
  }

  itemDialog.showModal();
  itemTitleInput.focus();
}

function populateTypeOptions(category) {
  itemTypeOptions.innerHTML = "";

  if (category !== "exams" && category !== "exercises") return;

  const defaults = category === "exams" ? ["Τεστ", "Διαγώνισμα"] : [];

  const existing = uniqueTypes(section.records[category]);
  const types = [...new Set([...defaults, ...existing])];

  for (const type of types) {
    const option = document.createElement("option");
    option.value = type;
    itemTypeOptions.appendChild(option);
  }
}

function initialiseHistoryNavigation() {
  if (!yearSelector || !sectionSelector) return;

  yearSelector.innerHTML = years.map(item => `
    <option value="${escapeHtml(item.id)}" ${item.id === year.id ? "selected" : ""}>
      ${escapeHtml(item.name)}
    </option>
  `).join("");

  renderSectionSelector(year.id);

  yearSelector.addEventListener("change", () => {
    renderSectionSelector(yearSelector.value);

    const firstSectionId = sectionSelector.value;
    if (firstSectionId) {
      navigateToSection(yearSelector.value, firstSectionId);
    }
  });

  sectionSelector.addEventListener("change", () => {
    if (sectionSelector.value) {
      navigateToSection(yearSelector.value, sectionSelector.value);
    }
  });
}

function renderSectionSelector(selectedYearId) {
  const selectedYear = years.find(item => item.id === selectedYearId);
  const availableSections = selectedYear?.sections || [];

  if (availableSections.length === 0) {
    sectionSelector.innerHTML = '<option value="">Δεν υπάρχουν τμήματα</option>';
    sectionSelector.disabled = true;
    return;
  }

  sectionSelector.disabled = false;
  sectionSelector.innerHTML = availableSections.map(item => `
    <option value="${escapeHtml(item.id)}" ${selectedYearId === year.id && item.id === section.id ? "selected" : ""}>
      ${escapeHtml(item.name)}
    </option>
  `).join("");
}

function navigateToSection(targetYearId, targetSectionId) {
  if (targetYearId === year.id && targetSectionId === section.id) return;

  window.location.href =
    `section.html?yearId=${encodeURIComponent(targetYearId)}` +
    `&sectionId=${encodeURIComponent(targetSectionId)}`;
}

function getSelectedDate() {
  return workingDateInput.value || "";
}

function isDatedCategory(category) {
  return category === "absences" || category === "exercises" || category === "participation";
}

function getRecordDate(record) {
  if (record.date) return record.date;

  const match = String(record.title || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function getVisibleRecords(category) {
  const records = (section.records[category] || []).filter(record => !record.hidden);
  const selectedDate = getSelectedDate();

  if (!selectedDate || !isDatedCategory(category)) return records;
  return records.filter(record => getRecordDate(record) === selectedDate);
}

function getHiddenRecords(category) {
  const selectedDate = getSelectedDate();
  const records = (section.records[category] || []).filter(record => record.hidden);

  if (!selectedDate || !isDatedCategory(category)) return records;
  return records.filter(record => getRecordDate(record) === selectedDate);
}

function hideRecord(category, recordId) {
  const record = section.records[category]?.find(item => item.id === recordId);
  if (!record) return;

  record.hidden = true;
  saveYears();
  renderAll();
}

function showRecord(category, recordId) {
  const record = section.records[category]?.find(item => item.id === recordId);
  if (!record) return;

  record.hidden = false;
  saveYears();
  renderAll();
}

function renderHiddenRecords(category) {
  const container = document.getElementById(`${category}-hidden-records`);
  if (!container) return;

  const hiddenRecords = getHiddenRecords(category);

  if (hiddenRecords.length === 0) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <span class="hidden-records-label">Κρυφές καταχωρίσεις:</span>
    ${hiddenRecords.map(record => `
      <button type="button" class="show-record-button" data-category="${category}" data-record-id="${record.id}">
        + ${escapeHtml(record.title || "Καταχώριση")}${record.type ? ` · ${escapeHtml(record.type)}` : ""}
      </button>
    `).join("")}
  `;

  for (const button of container.querySelectorAll(".show-record-button")) {
    button.onclick = () => showRecord(button.dataset.category, button.dataset.recordId);
  }
}

function updateDateFilterInterface() {
  const selectedDate = getSelectedDate();
  showAllDatesButton.classList.toggle("active", !selectedDate);

  dateFilterDescription.textContent = selectedDate
    ? `Προβάλλονται μόνο οι καταχωρίσεις της ${formatDateForDisplay(selectedDate)}.`
    : "Προβάλλονται όλες οι ημερομηνίες και τα συνολικά στατιστικά.";
}

function calculateParticipationAverage(student) {
  const values = getVisibleRecords("participation")
    .map(record => student.participation[record.id])
    .filter(value => value !== "-" && value !== undefined && value !== null && value !== "")
    .map(Number)
    .filter(Number.isFinite);

  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function renderAll() {
  renderCategoryTable("absences");
  renderCategoryTable("exams");
  renderCategoryTable("exercises");
  renderCategoryTable("participation");
  renderStatistics();
}

function renderCategoryTable(category) {
  const records = getVisibleRecords(category);
  const head = document.getElementById(`${category}-head`);
  const body = document.getElementById(`${category}-body`);

  renderHiddenRecords(category);

  head.innerHTML = ` <tr> <th class="sticky-name-column">Μαθητής</th>
      ${records.map(record => ` <th> <div class="column-heading">
            ${category === "exams" || category === "exercises"
              ? `<button type="button" class="edit-record-button" data-category="${category}" data-record-id="${record.id}">${escapeHtml(record.title || "-")}</button>`
              : `<strong>${escapeHtml(record.title || "-")}</strong>`}
            ${record.type ? `<small>${escapeHtml(record.type)}</small>` : ""}
            ${category === "exams" ? `<small>Μέγιστο: ${formatNumber(record.maxScore || 20)}</small>` : ""}
            ${category === "exercises" ? `<small>Πλήθος: ${formatNumber(record.maxExercises || 1)}</small>` : ""}
            <div class="column-action-buttons">
              <button type="button" class="hide-record-button" data-category="${category}" data-record-id="${record.id}" aria-label="Απόκρυψη καταχώρισης" title="Απόκρυψη">−</button>
              <button type="button" class="remove-column-button" data-category="${category}" data-record-id="${record.id}" aria-label="Διαγραφή στήλης" title="Διαγραφή">×</button>
            </div>
          </div> </th>`).join("")} </tr> `;

  if (section.students.length === 0) {
    body.innerHTML = `<tr><td colspan="${records.length + 1}" class="empty-table-cell"> Δεν υπάρχουν μαθητές </td> </tr>`;
  } else {
    body.innerHTML = section.students.map(student => `<tr>
        <th class="sticky-name-column student-row-heading">
          <button type="button" class="student-details-button" data-student-id="${student.id}">${escapeHtml(student.name)}</button>
        </th> ${records.map(record => `<td>${createCellControl(category, student, record)}</td>`).join("")} </tr>`).join("");
  }

  connectTableControls();
}

function createCellControl(category, student, record) {
  const value = student[category][record.id] ?? "-";

  if (category === "absences") {
    return ` <select class="cell-select" data-category="${category}" data-student-id="${student.id}" data-record-id="${record.id}">
        <option value="-" ${value === "-" ? "selected" : ""}>−</option>
        <option value="present" ${value === "present" ? "selected" : ""}>Παρών</option>
        <option value="unjustified" ${value === "unjustified" ? "selected" : ""}>Αδ. απουσία</option>
        <option value="justified" ${value === "justified" ? "selected" : ""}>Δικ. απουσία</option>
      </select>`;
  }

  if (category === "exercises") {
    const maxExercises = Math.max(1, Number(record.maxExercises) || 1);
    const options = [
      `<option value="-" ${value === "-" ? "selected" : ""}>−</option>`,
      `<option value="0" ${Number(value) === 0 && value !== "-" ? "selected" : ""}>0</option>`,
      ...Array.from({length: maxExercises}, (_, index) => {
        const number = index + 1;
        return `<option value="${number}" ${Number(value) === number ? "selected" : ""}>${number}</option>`;
      })
    ].join("");

    return `
      <select class="cell-select exercise-count-select" data-category="${category}" data-student-id="${student.id}" data-record-id="${record.id}">
        ${options}
      </select>
    `;
  }

  return `
    <input class="grade-input" type="text" inputmode="decimal" value="${escapeHtml(String(value))}"
      data-category="${category}" data-student-id="${student.id}" data-record-id="${record.id}"
      aria-label="Βαθμός ${escapeHtml(student.name)}">
  `;
}

function connectTableControls() {
  for (const select of document.querySelectorAll(".cell-select")) {
    updateSelectColor(select);

    select.onchange = () => {
      updateSelectColor(select);
      const value = select.dataset.category === "exercises" && select.value !== "-"
        ? Number(select.value)
        : select.value;
      updateStudentValue(select.dataset.category, select.dataset.studentId, select.dataset.recordId, value);
    };

    select.onkeydown = handleTableArrowNavigation;
  }

  for (const input of document.querySelectorAll(".grade-input")) {
    input.onkeydown = handleTableArrowNavigation;
    input.onchange = () => {
      const category = input.dataset.category;
      const studentId = input.dataset.studentId;
      const recordId = input.dataset.recordId;

      const rawValue = input.value.trim().replace(",", ".");

      if (rawValue === "-") {
        updateStudentValue(category, studentId, recordId, "-" );
        return;
      }

      const number = Number(rawValue);

      /*if (
        !Number.isFinite(number) ||
        number < 0
      ) {
        alert(
          "Ο βαθμός πρέπει να είναι έγκυρος μη αρνητικός αριθμός."
        );

        input.value = getStudentValue(
          category,
          studentId,
          recordId
        );

        return;
      }*/

      if (category === "exams") {
        const record =
        section.records.exams.find(item => item.id === recordId);

        const maxScore = Number(record?.maxScore ?? 20);

        if (number > maxScore) {
          alert(`Ο βαθμός δεν μπορεί να ξεπερνά το ${formatNumber(maxScore)}.`);
          input.value = getStudentValue(category, studentId, recordId);
          return;
        }
      }

      updateStudentValue(category, studentId, recordId, number);
    };
  }

  for (const button of document.querySelectorAll(".hide-record-button")) {
    button.onclick = () => {hideRecord(button.dataset.category, button.dataset.recordId);};
  }

  for (const button of document.querySelectorAll(".remove-column-button")) {
    button.onclick = () => {deleteRecord(button.dataset.category, button.dataset.recordId);};
  }

  for (const button of document.querySelectorAll(".edit-record-button")) {
    button.onclick = () => {openEditRecordDialog(button.dataset.category, button.dataset.recordId);};
  }
}

function updateStudentValue(category, studentId, recordId, value) {
  const student = section.students.find(item => item.id === studentId);
  if (!student) return;

  student[category][recordId] = value;
  saveYears();
  renderStatistics();
}

function getStudentValue(category, studentId, recordId) {
  const student = section.students.find(item => item.id === studentId);
  return student?.[category]?.[recordId] ?? "-";
}

function deleteRecord(category, recordId) {
  const record = section.records[category].find(item => item.id === recordId);
  if (!record || !confirm(`Να διαγραφεί η καταχώριση «${record.title}»;`)) return;

  section.records[category] = section.records[category].filter(item => item.id !== recordId);
  for (const student of section.students) delete student[category][recordId];

  saveYears();
  renderAll();
}


function isStatisticsColumnHidden(columnKey) {
  return section.hiddenStatisticsColumns.includes(columnKey);
}

function hideStatisticsColumn(columnKey) {
  if (!section.hiddenStatisticsColumns.includes(columnKey)) {
    section.hiddenStatisticsColumns.push(columnKey);
  }

  saveYears();
  renderStatistics();
}

function showStatisticsColumn(columnKey) {
  section.hiddenStatisticsColumns = section.hiddenStatisticsColumns.filter(key => key !== columnKey);

  saveYears();
  renderStatistics();
}

function renderHiddenStatisticsColumns(columns) {
  const container = document.getElementById("statistics-hidden-columns");

  if (!container) {
    return;
  }

  const hiddenColumns = columns.filter(column => isStatisticsColumnHidden(column.key));

  if (hiddenColumns.length === 0) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  container.hidden = false;

  container.innerHTML = `<span class="hidden-columns-label"> </span>
      ${hiddenColumns.map(column => `<button type="button" class="show-statistics-column-button" data-column-key="${escapeHtml(column.key)}">
      + ${escapeHtml(column.label)} </button>`).join("")}`;

  for (const button of container.querySelectorAll(".show-statistics-column-button")) {
    button.onclick = () => {showStatisticsColumn(button.dataset.columnKey);};
  }
}

function renderStatistics() {
  const head = document.getElementById("statistics-head");
  const body = document.getElementById("statistics-body");

  const exerciseTypes = uniqueTypes(getVisibleRecords("exercises"));

  const examTypes = uniqueTypes(getVisibleRecords("exams"));

  const columns = [
    {
      key: "participation",
      label: "Μ.Ο. συμμετοχής",
      header: "Μ.Ο. συμμετοχής",
      value: student => formatAverage(calculateParticipationAverage(student))
    },

    {
      key: "exercises-overall",
      label: "Ασκήσεις συνολικά",
      header: `Ασκήσεις <small>Συνολικά</small>`,
      value: student => calculateOverallExerciseFraction(student)
    },

    ...exerciseTypes.map(type => ({
      key: `exercise-type:${type}`,
      label: `Ασκήσεις ${type}`,
      header: `
        Ασκήσεις
        <small>${escapeHtml(type)}</small>
      `,
      value: student =>
        calculateExerciseFraction(student, type)
    })),

    {
      key: "exams-overall",
      label: "Γραπτά συνολικά",
      header: `
        Γραπτά Μ.Ο.
        <small>Συνολικά</small>
      `,
      value: student =>
        formatAverage(
          calculateOverallExamAverage(student)
        )
    },

    ...examTypes.map(type => ({
      key: `exam-type:${type}`,
      label: `Γραπτά ${type}`,
      header: `
        Γραπτά Μ.Ο.
        <small>${escapeHtml(type)}</small>
      `,
      value: student =>
        formatAverage(
          calculateExamAverage(student, type)
        )
    })),

    {
      key: "justified-absences",
      label: "Δικαιολογημένες απουσίες",
      header: "Δικ. απουσίες",
      value: student =>
        calculateAbsences(student).justified
    },

    {
      key: "unjustified-absences",
      label: "Αδικαιολόγητες απουσίες",
      header: "Αδ. απουσίες",
      value: student =>
        calculateAbsences(student).unjustified
    },

    {
      key: "total-absences",
      label: "Συνολικές απουσίες",
      header: "Συν. απουσίες",
      value: student =>
        calculateAbsences(student).total
    },

    {
      key: "actions",
      label: "Ενέργειες",
      header: "",
      value: student => `
        <button
          type="button"
          class="student-delete-button"
          data-student-id="${student.id}"
        >
          Διαγραφή
        </button>
      `
    }
  ];

  const visibleColumns = columns.filter(
    column =>
      !isStatisticsColumnHidden(column.key)
  );

  renderHiddenStatisticsColumns(columns);

  head.innerHTML = `
    <tr class="statistics-hide-row">
      <th class="sticky-name-column"></th>

      ${visibleColumns.map(column => `
        <th>
          <button
            type="button"
            class="hide-statistics-column-button"
            data-column-key="${escapeHtml(column.key)}"
            title="Απόκρυψη στήλης"
            aria-label="Απόκρυψη ${escapeHtml(column.label)}"
          >
            −
          </button>
        </th>
      `).join("")}
    </tr>

    <tr>
      <th class="sticky-name-column">
        Μαθητής
      </th>

      ${visibleColumns.map(column => `
        <th>
          ${column.header}
        </th>
      `).join("")}
    </tr>
  `;

  if (section.students.length === 0) {
    body.innerHTML = `
      <tr>
        <td
          colspan="${visibleColumns.length + 1}"
          class="empty-table-cell"
        >
          Δεν υπάρχουν μαθητές.
        </td>
      </tr>
    `;
  } else {
    body.innerHTML = section.students
      .map(student => `
        <tr>
          <th
            class="sticky-name-column student-row-heading"
          >
            <button
              type="button"
              class="student-details-button"
              data-student-id="${student.id}"
            >
              ${escapeHtml(student.name)}
            </button>
          </th>

          ${visibleColumns.map(column => `
            <td>
              ${column.value(student)}
            </td>
          `).join("")}
        </tr>
      `)
      .join("");
  }

  for (
    const button of document.querySelectorAll(
      ".hide-statistics-column-button"
    )
  ) {
    button.onclick = () => {
      hideStatisticsColumn(
        button.dataset.columnKey
      );
    };
  }

  for (
    const button of document.querySelectorAll(
      ".student-delete-button"
    )
  ) {
    button.onclick = () => {
      deleteStudent(
        button.dataset.studentId
      );
    };
  }

  for (
    const button of document.querySelectorAll(
      ".student-details-button"
    )
  ) {
    button.onclick = () => {
      openStudentDetails(
        button.dataset.studentId
      );
    };
  }
}
function openStudentDetails(studentId) {
  const student = section.students.find(item => item.id === studentId);
  if (!student) return;
  selectedStudentId = studentId;

  const absenceStats = calculateAbsences(student);
  studentDetailsTitle.textContent = student.name;
  //studentDetailsSummary.textContent = `Συμμετοχή: ${formatAverage(calculateNumericAverage(student.participation))} Απουσίες: ${absenceStats.total}`;

  studentDetailsBody.innerHTML = [createHistorySection("Ασκήσεις", "exercises", student), createHistorySection("Γραπτά", "exams", student), 
  createHistorySection("Συμμετοχή", "participation", student), createHistorySection("Απουσίες", "absences", student)].join("");

  studentDetailsDialog.showModal();
}

function createHistorySection(title, category, student) {
  const records = getVisibleRecords(category);

  if (records.length === 0) {
    return `
      <section class="history-section">
        <h3>${escapeHtml(title)}</h3>
        <p class="history-empty">
          Δεν υπάρχουν καταχωρίσεις.
        </p>
      </section>
    `;
  }

  const rows = records.map(record => {
    const rawValue =
      student[category][record.id] ?? "-";

    return `
      <tr>
        <td>${escapeHtml(record.title || "-")}</td>

        ${
          category === "exams" ||
          category === "exercises"
            ? `
              <td>
                ${escapeHtml(record.type || "-")}
              </td>
            `
            : ""
        }

        <td>
          ${formatHistoryValue(
            category,
            rawValue,
            record
          )}
        </td>

      </tr>
    `;
  }).join("");

  let valueHeader = "";

  if (
    category === "exams" ||
    category === "participation"
  ) {
    valueHeader = "Βαθμός";
  }

  return `
    <section class="history-section">
      <h3>${escapeHtml(title)}</h3>

      <div class="data-table-wrapper">
        <table class="history-table">
          ${
            category === "absences"
              ? ""
              : `
                <thead>
                  <tr>
                    <th>Ημερομηνία / τίτλος</th>

                    ${
                      category === "exams" ||
                      category === "exercises"
                        ? "<th>Τύπος</th>"
                        : ""
                    }
                    <th>${valueHeader}</th>

                    
                  </tr>
                </thead>
              `
            }
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function formatHistoryValue(category, value, record = null) {
  if (value === "-") {
    return "−";
  }

  if (category === "absences") {
    return {
      present: `
        <span class="history-status status-present">
          Παρών
        </span>
      `,
      justified: `
        <span class="history-status status-justified">
          Δικαιολογημένη απουσία
        </span>
      `,
      unjustified: `
        <span class="history-status status-unjustified">
          Αδικαιολόγητη απουσία
        </span>
      `
    }[value] || "−";
  }

  if (category === "exercises") {
    const completed = Number(value);
    const total = Number(record?.maxExercises ?? 1);

    if (!Number.isFinite(completed) || !Number.isFinite(total)) return "−";
    return `${formatNumber(completed)}/${formatNumber(total)}`;
  }

  if (category === "exams") {
    const maxScore = Number(record?.maxScore ?? 20);
    const grade = Number(value);

    if (
      !Number.isFinite(grade) ||
      !Number.isFinite(maxScore)
    ) {
      return "−";
    }

    return `${formatNumber(grade)}/${formatNumber(maxScore)}`;
  }

  return escapeHtml(String(value));
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "−";
  }

  return number.toLocaleString("el-GR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function calculateNumericAverage(valuesObject) {
  const values = Object.values(valuesObject).filter(value => value !== "-" && Number.isFinite(Number(value))).map(Number);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function normalizeExamGrade(value, maxScore) {
  const numericValue = Number(value);
  const numericMaxScore = Number(maxScore);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isFinite(numericMaxScore) ||
    numericMaxScore <= 0
  ) {
    return null;
  }

  return (numericValue / numericMaxScore) * 20;
}

function calculateExamAverage(student, type) {
  const relevantRecords = getVisibleRecords("exams").filter(record => {
  const recordType = record.type?.trim() || "-";
    return recordType === type;
  });

  const normalizedGrades = [];

  for (const record of relevantRecords) {
    const value = student.exams[record.id];

    if (value === "-" || value === undefined || value === null || value === "") {
      continue;
    }

    const normalizedGrade = normalizeExamGrade(value, record.maxScore || 20);

    if (normalizedGrade !== null) {
      normalizedGrades.push(normalizedGrade);
    }
  }

  if (normalizedGrades.length === 0) {
    return null;
  }

  const total = normalizedGrades.reduce(
    (sum, grade) => sum + grade,
    0
  );

  return total / normalizedGrades.length;
}

function calculateOverallExamAverage(student) {
  const normalizedGrades = [];

  for (const record of getVisibleRecords("exams")) {
    const value = student.exams[record.id];

    if (value === "-" || value === undefined || value === null || value === "") {
      continue;
    }

    const normalizedGrade = normalizeExamGrade(value, record.maxScore || 20);

    if (normalizedGrade !== null) {
      normalizedGrades.push(normalizedGrade);
    }
  }

  if (normalizedGrades.length === 0) {
    return null;
  }

  const total = normalizedGrades.reduce((sum, grade) => sum + grade, 0);

  return total / normalizedGrades.length;
}


function calculateExerciseFraction(student, type) {
  const relevantRecords = getVisibleRecords("exercises").filter(record => {
    const recordType = record.type?.trim() || "Χωρίς τύπο";
    return recordType === type;
  });

  let completed = 0;
  let total = 0;
  let hasValue = false;

  for (const record of relevantRecords) {
    const value = student.exercises[record.id];
    if (value === "-" || value === undefined || value === null || value === "") continue;
    completed += Number(value) || 0;
    total += Number(record.maxExercises) || 1;
    hasValue = true;
  }

  return hasValue ? `${formatNumber(completed)}/${formatNumber(total)}` : "−";
}

function calculateOverallExerciseFraction(student) {
  let completed = 0;
  let total = 0;
  let hasValue = false;

  for (const record of getVisibleRecords("exercises")) {
    const value = student.exercises[record.id];
    if (value === "-" || value === undefined || value === null || value === "") continue;
    completed += Number(value) || 0;
    total += Number(record.maxExercises) || 1;
    hasValue = true;
  }

  return hasValue ? `${formatNumber(completed)}/${formatNumber(total)}` : "−";
}

function calculateAbsences(student) {
  const values = getVisibleRecords("absences").map(record => student.absences[record.id]);
  const justified = values.filter(value => value === "justified").length;
  const unjustified = values.filter(value => value === "unjustified").length;
  return { justified, unjustified, total: justified + unjustified };
}

function uniqueTypes(records) {
  return [
    ...new Set(
      records.map(record =>
        record.type?.trim() || "(-)"
      )
    )
  ];
}

function formatAverage(value) {
  return value === null ? "−" : value.toLocaleString("el-GR", { maximumFractionDigits: 2 });
}

function deleteStudent(studentId) {
  const student = section.students.find(item => item.id === studentId);
  if (!student || !confirm(`Να διαγραφεί ο μαθητής «${student.name}»;`)) return;

  section.students = section.students.filter(item => item.id !== studentId);
  saveYears();
  renderAll();
}

function loadYears() {
  try {
    const savedYears = localStorage.getItem(STORAGE_KEY);
    const parsedYears = savedYears ? JSON.parse(savedYears) : [];
    return Array.isArray(parsedYears) ? parsedYears : [];
  } catch (error) {
    console.error("Σφάλμα φόρτωσης:", error);
    return [];
  }
}

function saveYears(updateDates = true) {
  if (updateDates && year && section) {
    updateModificationDates();
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(years)
  );
}

function getTodayDateValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDateForDisplay(value) {
  if (!value) return "−";
  const [yearPart, monthPart, dayPart] = value.split("-");
  return `${dayPart}/${monthPart}/${yearPart}`;
}

function getHighestExerciseValue(recordId) {
  const values = section.students
    .map(student => student.exercises[recordId])
    .filter(value => value !== "-" && value !== undefined && value !== null && Number.isFinite(Number(value)))
    .map(Number);
  return values.length ? Math.max(...values) : null;
}

function createId() {
  return typeof crypto.randomUUID === "function"? crypto.randomUUID(): `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getHighestExamGrade(recordId) {
  const grades = section.students
    .map(student => student.exams[recordId])
    .filter(value => {return (value !== "-" && value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value)));})
    .map(Number);

  if (grades.length === 0) {
    return null;
  }

  return Math.max(...grades);
}

function moveToAdjacentCell(currentControl, direction) {
  const currentCell = currentControl.closest("td");

  if (!currentCell) {
    return;
  }

  const currentRow = currentCell.closest("tr");
  const tableBody = currentRow.closest("tbody");

  if (!currentRow || !tableBody) {
    return;
  }

  const rows = Array.from(tableBody.querySelectorAll("tr"));
  const cells = Array.from(currentRow.querySelectorAll("td"));

  const currentRowIndex = rows.indexOf(currentRow);
  const currentColumnIndex = cells.indexOf(currentCell);

  let targetRowIndex = currentRowIndex;
  let targetColumnIndex = currentColumnIndex;

  if (direction === "up") {
    targetRowIndex--;
  }

  if (direction === "down") {
    targetRowIndex++;
  }

  if (direction === "left") {
    targetColumnIndex--;
  }

  if (direction === "right") {
    targetColumnIndex++;
  }

  if (
    targetRowIndex < 0 ||
    targetRowIndex >= rows.length
  ) {
    return;
  }

  const targetRow = rows[targetRowIndex];
  const targetCells = Array.from(
    targetRow.querySelectorAll("td")
  );

  if (
    targetColumnIndex < 0 ||
    targetColumnIndex >= targetCells.length
  ) {
    return;
  }

  const targetCell = targetCells[targetColumnIndex];

  const targetControl = targetCell.querySelector(
    "input, select, button"
  );

  if (!targetControl) {
    return;
  }

  targetControl.focus();

  if (targetControl instanceof HTMLInputElement) {
    targetControl.select();
  }
}

function handleTableArrowNavigation(event) {
  let direction = null;

  if (event.key === "ArrowUp") {
    direction = "up";
  }

  if (event.key === "ArrowDown") {
    direction = "down";
  }

  if (event.key === "ArrowLeft") {
    direction = "left";
  }

  if (event.key === "ArrowRight") {
    direction = "right";
  }

  if (!direction) {
    return;
  }

  event.preventDefault();

  moveToAdjacentCell(
    event.currentTarget,
    direction
  );
}

function createEmptyStudent(name) {
  return {
    id: createId(),
    name,
    absences: {},
    exams: {},
    exercises: {},
    participation: {}
  };
}

function normaliseExcelText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("el");
}

function findStudentColumns(rows) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    let surnameColumn = -1;
    let firstNameColumn = -1;

    row.forEach((cell, columnIndex) => {
      const header = normaliseExcelText(cell);

      if (header.includes("επωνυμο") && header.includes("μαθητ")) {
        surnameColumn = columnIndex;
      }

      if (header.includes("ονομα") && header.includes("μαθητ") && !header.includes("πατερα") && !header.includes("μητερα")) {
        firstNameColumn = columnIndex;
      }
    });

    if (surnameColumn !== -1 && firstNameColumn !== -1) {
      return {headerRow: rowIndex, surnameColumn, firstNameColumn};
    }
  }

  return null;
}

async function importStudentsFromExcel(file) {
  if (typeof XLSX === "undefined") {
    throw new Error("Δεν φορτώθηκε η βιβλιοθήκη Excel. Ελέγξτε τη σύνδεση στο διαδίκτυο και δοκιμάστε ξανά.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {type: "array"});

  let detected = null;

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      raw: false
    });

    const columns = findStudentColumns(rows);

    if (columns) {
      detected = {rows, ...columns};
      break;
    }
  }

  if (!detected) {
    throw new Error("Δεν βρέθηκαν οι στήλες «Επώνυμο μαθητή» και «Όνομα μαθητή» στο αρχείο.");
  }

  const existingNames = new Set(
    section.students.map(student => normaliseExcelText(student.name))
  );

  let added = 0;
  let duplicates = 0;

  for (let rowIndex = detected.headerRow + 1; rowIndex < detected.rows.length; rowIndex += 1) {
    const row = detected.rows[rowIndex] || [];
    const surname = String(row[detected.surnameColumn] ?? "").trim();
    const firstName = String(row[detected.firstNameColumn] ?? "").trim();

    if (!surname && !firstName) continue;

    const fullName = `${surname} ${firstName}`.replace(/\s+/g, " ").trim();
    const normalisedName = normaliseExcelText(fullName);

    if (!normalisedName) continue;

    if (existingNames.has(normalisedName)) {
      duplicates += 1;
      continue;
    }

    section.students.push(createEmptyStudent(fullName));
    existingNames.add(normalisedName);
    added += 1;
  }

  if (added === 0 && duplicates === 0) {
    throw new Error("Δεν βρέθηκαν μαθητές κάτω από τις επικεφαλίδες του αρχείου.");
  }

  if (added > 0) {
    saveYears();
  }

  return {added, duplicates};
}

function updateModificationDates() {
  const now = new Date().toISOString();

  section.updatedAt = now;
  year.updatedAt = now;
}

function updateSelectColor(select) {
  select.classList.remove(
    "value-yes",
    "value-no",
    "value-present",
    "value-justified",
    "value-unjustified",
    "value-empty"
  );

  const classByValue = {
    yes: "value-yes",
    no: "value-no",
    present: "value-present",
    justified: "value-justified",
    unjustified: "value-unjustified",
    "-": "value-empty"
  };

  const className = classByValue[select.value];

  if (className) {
    select.classList.add(className);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
