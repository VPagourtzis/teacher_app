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
} else {
  initialiseSectionData();
  sectionTitle.textContent = section.name;
  yearTitle.textContent = `Σχολική χρονιά: ${year.name}`;
  document.title = `${section.name} - ${year.name}`;
  renderAll();
}

const studentDialog = document.getElementById("student-dialog");
const studentForm = document.getElementById("student-form");
const studentNameInput = document.getElementById("student-name");
const studentError = document.getElementById("student-error");
const itemDialog = document.getElementById("item-dialog");
const itemForm = document.getElementById("item-form");
const itemTitleInput = document.getElementById("item-title");
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

for (const button of document.querySelectorAll(".tab-button")) {
  button.addEventListener("click", () => openTab(button.dataset.tab));
}

document.getElementById("add-student-button").addEventListener("click", () => {
  studentForm.reset();
  studentError.textContent = "";
  studentDialog.showModal();
  studentNameInput.focus();
});

document.getElementById("cancel-student-button").addEventListener("click", () => {
  studentDialog.close();
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

  section.students.push({id: createId(), name, absences: {}, exams: {}, exercises: {}, participation: {}});

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
  button.addEventListener("click", () => openItemDialog(button.dataset.addItem));
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

  const title = itemTitleInput.value.trim();
  const type = itemTypeInput.value.trim();

  let maxScore = null;

  if (activeItemCategory === "exams") {
    const rawMaxScore = itemMaxScoreInput.value.trim().replace(",", ".");
    maxScore = Number(rawMaxScore);
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

  } else {
    const newRecord = {id: createId(), title: title, type: activeItemCategory === "exams" || activeItemCategory === "exercises" ? type : ""};
    if (activeItemCategory === "exams") {
      newRecord.maxScore = maxScore;
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
  }
  
  for (const examRecord of section.records.exams) {
    if (!Number.isFinite(Number(examRecord.maxScore)) || Number(examRecord.maxScore) <= 0) {
      examRecord.maxScore = 20;
    }
  }

  for (const student of section.students) {
    for (const category of ["absences", "exams", "exercises", "participation"]) {
      if (!student[category] || typeof student[category] !== "object" || Array.isArray(student[category])) {
        student[category] = {};
      }
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

  activeItemCategory = category;
  editingRecordId = null;

  itemForm.reset();
  itemError.textContent = "";
  saveItemButton.textContent = "Προσθήκη";

  const settings = {
    absences: {
      title: "Νέα ημερομηνία απουσιών",
      placeholder: "π.χ. 03/07/2026",
      showType: false,
      showMaxScore: false
    },

    exams: {
      title: "Νέο γραπτό",
      placeholder: "π.χ. 1ο τεστ ή 03/07/2026",
      showType: true,
      showMaxScore: true
    },

    exercises: {
      title: "Νέα άσκηση",
      placeholder: "π.χ. Άσκηση 5 ή 03/07/2026",
      showType: true,
      showMaxScore: false
    },

    participation: {
      title: "Νέα ημερομηνία συμμετοχής",
      placeholder: "π.χ. 03/07/2026",
      showType: false,
      showMaxScore: false
    }
  };

  const setting = settings[category];

  itemDialogTitle.textContent = setting.title;
  itemTitleInput.placeholder = setting.placeholder;

  itemTypeField.hidden = !setting.showType;
  itemMaxScoreField.hidden = !setting.showMaxScore;

  populateTypeOptions(category);

  itemTypeInput.value = "";

  if (category === "exams") {
    itemMaxScoreInput.value = "20";
  }

  itemDialog.showModal();
  itemTitleInput.focus();
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
    absences: {title: "Επεξεργασία ημερομηνίας απουσιών", showType: false, showMaxScore: false},
    exams: {title: "Επεξεργασία γραπτού", showType: true, showMaxScore: true},
    exercises: {title: "Επεξεργασία άσκησης", showType: true, showMaxScore: false},
    participation: {title: "Επεξεργασία συμμετοχής", showType: false, showMaxScore: false}
  };

  const setting = settings[category];

  itemDialogTitle.textContent = setting.title;
  itemTypeField.hidden = !setting.showType;
  itemMaxScoreField.hidden = !setting.showMaxScore;

  populateTypeOptions(category);

  itemTitleInput.value = record.title || "";
  itemTypeInput.value = record.type || "";

  if (category === "exams") {
    itemMaxScoreInput.value = String(record.maxScore ?? 20);
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

function renderAll() {
  renderCategoryTable("absences");
  renderCategoryTable("exams");
  renderCategoryTable("exercises");
  renderCategoryTable("participation");
  renderStatistics();
}

function renderCategoryTable(category) {
  const records = section.records[category];
  const head = document.getElementById(`${category}-head`);
  const body = document.getElementById(`${category}-body`);

  head.innerHTML = ` <tr> <th class="sticky-name-column">Μαθητής</th>
      ${records.map(record => ` <th> <div class="column-heading">
            <button type="button" class="edit-record-button" data-category="${category}" data-record-id="${record.id}">${escapeHtml(record.title || "-")}</button>
            ${record.type ? `<small>${escapeHtml(record.type)}</small>` : ""}
            ${category === "exams" ? `<small>Μέγιστο: ${formatNumber(record.maxScore || 20)}</small>` : ""}
            <button type="button" class="remove-column-button" data-category="${category}" data-record-id="${record.id}" aria-label="Διαγραφή στήλης">×</button>
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
    return `
      <select class="cell-select compact-select" data-category="${category}" data-student-id="${student.id}" data-record-id="${record.id}">
        <option value="-" ${value === "-" ? "selected" : ""}>−</option>
        <option value="yes" ${value === "yes" ? "selected" : ""}>✓</option>
        <option value="no" ${value === "no" ? "selected" : ""}>✕</option>
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
      updateStudentValue(select.dataset.category, select.dataset.studentId, select.dataset.recordId, select.value);
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

  const exerciseTypes = uniqueTypes(section.records.exercises);

  const examTypes = uniqueTypes(section.records.exams);

  const columns = [
    {
      key: "participation",
      label: "Μ.Ο. συμμετοχής",
      header: "Μ.Ο. συμμετοχής",
      value: student => formatAverage(calculateNumericAverage(student.participation))
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
  const records = section.records[category];

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
    if (value === "yes") {
      return `
        <span class="history-status status-yes">
          ✓ Ναι
        </span>
      `;
    }

    if (value === "no") {
      return `
        <span class="history-status status-no">
          ✕ Όχι
        </span>
      `;
    }

    return "−";
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
  const relevantRecords = section.records.exams.filter(record => {
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

  for (const record of section.records.exams) {
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
  const recordIds =
    section.records.exercises
      .filter(record => {
        const recordType =
          record.type?.trim() || "Χωρίς τύπο";

        return recordType === type;
      })
      .map(record => record.id);

  const values = recordIds
    .map(id => student.exercises[id])
    .filter(
      value =>
        value === "yes" ||
        value === "no"
    );

  const yesCount =
    values.filter(value => value === "yes").length;

  return values.length
    ? `${yesCount}/${values.length}`
    : "−";
}

function calculateOverallExerciseFraction(student) {
  const values = section.records.exercises.map(record => student.exercises[record.id]).filter(value => value === "yes" || value === "no");

  if (values.length === 0) {
    return "−";
  }

  const yesCount = values.filter(value => value === "yes").length;

  return `${yesCount}/${values.length}`;
}

function calculateAbsences(student) {
  const values = Object.values(student.absences);
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
