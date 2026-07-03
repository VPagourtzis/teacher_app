const STORAGE_KEY = "teacherAppYears";

const yearsContainer = document.getElementById("years-container");

const emptyState = document.getElementById("empty-state");

const addYearButton = document.getElementById("add-year-button");

const yearDialog = document.getElementById("year-dialog");
const yearForm = document.getElementById("year-form");
const yearNameInput = document.getElementById("year-name");
const yearError = document.getElementById("year-error");

const cancelYearButton = document.getElementById("cancel-year-button");

const sectionDialog = document.getElementById("section-dialog");

const sectionForm = document.getElementById("section-form");

const sectionNameInput = document.getElementById("section-name");

const sectionError = document.getElementById("section-error");

const cancelSectionButton = document.getElementById("cancel-section-button");
const importYearFileInput = document.getElementById("import-year-file");

const importSectionFileInput = document.getElementById("import-section-file");

let selectedYearId = null;
let years = loadYears();

renderYears();

addYearButton.addEventListener("click", function () {
  yearForm.reset();
  yearError.textContent = "";

  yearDialog.showModal();
  yearNameInput.focus();
});

cancelYearButton.addEventListener("click", function () {yearDialog.close();});

cancelSectionButton.addEventListener("click", function () {sectionDialog.close();});

yearForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const yearName = yearNameInput.value.trim();

  if (yearName === "") {
    yearError.textContent = "Όνομα σχολικής χρονιάς.";
    return;
  }

/*  const yearAlreadyExists = years.some(
    year =>
      year.name.toLowerCase() === yearName.toLowerCase()
  );

  if (yearAlreadyExists) {
    yearError.textContent =
      "Αυτή η σχολική χρονιά υπάρχει ήδη.";

    return;
  }*/

  const now = new Date().toISOString();

  years.push({
    id: crypto.randomUUID(),
    name: yearName,
    sections: [],
    createdAt: now,
    updatedAt: now
  });

  saveYears();
  renderYears();

  yearDialog.close();
});

sectionForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const sectionName = sectionNameInput.value.trim();

  const selectedYear = years.find(year => year.id === selectedYearId);

  if (!selectedYear) {
    sectionDialog.close();
    return;
  }

  if (sectionName === "") {
    sectionError.textContent = "Όνομα τμήματος";
    return;
  }

  /*
  const sectionAlreadyExists = selectedYear.sections.some(
    section =>
      section.name.toLowerCase() ===
      sectionName.toLowerCase()
  );

  if (sectionAlreadyExists) {
    sectionError.textContent =
      "Αυτό το τμήμα υπάρχει ήδη στη συγκεκριμένη χρονιά.";

    return;
  }*/

  const now = new Date().toISOString();

  selectedYear.sections.push({
    id: crypto.randomUUID(),
    name: sectionName,
    createdAt: now,
    updatedAt: now
  });

  selectedYear.updatedAt = now;

  saveYears();
  renderYears();

  sectionDialog.close();
});

function loadYears() {
  try {
    const savedYears = localStorage.getItem(STORAGE_KEY);

    if (!savedYears) {
      return [];
    }

    const parsedYears = JSON.parse(savedYears);

    if (Array.isArray(parsedYears)) {
      return parsedYears;
    } else {
      return [];
    }

  } catch (error) {
    console.error("Σφάλμα φόρτωσης:", error);
    return [];
  }
}

function saveYears() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(years));
}

function renderYears() {
  yearsContainer.innerHTML = "";

  emptyState.hidden = years.length > 0;

  for (const year of years) {
    const yearCard = document.createElement("article");

    yearCard.className = "year-card";

    let sectionsHtml;

    if (year.sections.length === 0) {
      sectionsHtml = `
        <p class="no-sections">
          Δεν υπάρχουν ακόμη τμήματα.
        </p>
      `;
    } else {
      sectionsHtml = year.sections
        .map(section => `
          <div class="section-item">
            <div class="section-main-information">
              <button
                type="button"
                class="section-name open-section-button"
                data-year-id="${year.id}"
                data-section-id="${section.id}"
              >
                ${escapeHtml(section.name)}
              </button>

              <div class="date-information section-dates">
                <span>
                  Ημ. δημιουργίας:
                  ${formatDateTime(section.createdAt)}
                </span>

                <span>
                  Τελ. τροποποίηση:
                  ${formatDateTime(section.updatedAt)}
                </span>
              </div>
            </div>

            <div class="card-actions">
            <button
            type="button"
            class="download-button download-year-button"
            data-year-id="${year.id}"
            aria-label="Λήψη JSON"
            title="Λήψη JSON"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m0 0 5-5m-5 5-5-5M5 19h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
            <button
              type="button"
              class="section-delete-button"
              data-year-id="${year.id}"
              data-section-id="${section.id}"
            >
              Διαγραφή
            </button>
          </div>
          </div>
        `)
        .join("");
    }

    yearCard.innerHTML = `
      <div class="year-card-header">
        <div>
          <h3>${escapeHtml(year.name)}</h3>

          <div class="date-information">
            <span>
              Ημ. δημιουργίας:
              ${formatDateTime(year.createdAt)}
            </span>

            <span>
              Τελ. τροποποίηση:
              ${formatDateTime(year.updatedAt)}
            </span>
          </div>
        </div>

        <div class="card-actions">
          <button
          type="button"
          class="download-button download-year-button"
          data-year-id="${year.id}"
          aria-label="Λήψη JSON"
          title="Λήψη JSON"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              d="M12 3v12m0 0 5-5m-5 5-5-5M5 19h14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

          <button
            type="button"
            class="danger-button delete-year-button"
            data-year-id="${year.id}"
          >
            Διαγραφή
          </button>
        </div>
      </div>

      <div class="sections-list">
        ${sectionsHtml}
      </div>

      <button
        type="button"
        class="add-section-button"
        data-year-id="${year.id}"
      >
        + Προσθήκη τμήματος
      </button>
    `;

    yearsContainer.appendChild(yearCard);
  }

  connectButtons();
}

function connectButtons() {
  const addSectionButtons = document.querySelectorAll(".add-section-button");

  for (const button of addSectionButtons) {
    button.addEventListener("click", function () {
      selectedYearId = button.dataset.yearId;

      sectionForm.reset();
      sectionError.textContent = "";

      sectionDialog.showModal();
      sectionNameInput.focus();
    });
  }

  const deleteYearButtons = document.querySelectorAll(".delete-year-button");

  for (const button of deleteYearButtons) {
    button.addEventListener("click", function () {deleteYear(button.dataset.yearId);});
  }


  const openSectionButtons = document.querySelectorAll(".open-section-button");

  for (const button of openSectionButtons) {
    button.addEventListener("click", function () {
      const yearId = button.dataset.yearId;
      const sectionId = button.dataset.sectionId;

      window.location.href =
        `section.html?yearId=${encodeURIComponent(yearId)}` +
        `&sectionId=${encodeURIComponent(sectionId)}`;
    });
  }

  const deleteSectionButtons = document.querySelectorAll(".section-delete-button");

  for (const button of deleteSectionButtons) {
    button.addEventListener("click", function () {
      deleteSection(button.dataset.yearId, button.dataset.sectionId);
    });
  }

  const downloadYearButtons = document.querySelectorAll(".download-year-button");

  for (const button of downloadYearButtons) {
    button.addEventListener("click", function () {
      downloadYear(button.dataset.yearId);
    });
  }

  const downloadSectionButtons =
  document.querySelectorAll(".download-section-button");

  for (const button of downloadSectionButtons) {
    button.addEventListener("click", function () {
      downloadSection(button.dataset.yearId, button.dataset.sectionId);
    });
  }

}

function deleteYear(yearId) {
  const year = years.find(currentYear => currentYear.id === yearId);

  if (!year) {
    return;
  }

  const shouldDelete = confirm(`Να διαγραφεί η χρονιά "${year.name}" και όλα τα τμήματά της;`);

  if (!shouldDelete) {
    return;
  }

  years = years.filter(currentYear => currentYear.id !== yearId);
  saveYears();
  renderYears();
}

function deleteSection(yearId, sectionId) {
  const year = years.find(currentYear => currentYear.id === yearId);

  if (!year) {
    return;
  }

  const section = year.sections.find(currentSection => currentSection.id === sectionId);

  if (!section) {
    return;
  }

  const shouldDelete = confirm(`Να διαγραφεί το τμήμα "${section.name}";`);

  if (!shouldDelete) {
    return;
  }

  year.sections = year.sections.filter(currentSection => currentSection.id !== sectionId);
  year.updatedAt = new Date().toISOString();
  saveYears();
  renderYears();
}

function downloadJsonFile(data, filename) {
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob(
    [json],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function downloadYear(yearId) {
  const year = years.find(
    currentYear => currentYear.id === yearId
  );

  if (!year) {
    return;
  }

  const safeName = createSafeFilename(year.name);

  downloadJsonFile(
    year,
    `${safeName}.json`
  );
}

function downloadSection(yearId, sectionId) {
  const year = years.find(
    currentYear => currentYear.id === yearId
  );

  if (!year) {
    return;
  }

  const section = year.sections.find(
    currentSection =>
      currentSection.id === sectionId
  );

  if (!section) {
    return;
  }

  const exportedData = {
    schoolYear: {
      id: year.id,
      name: year.name,
      createdAt: year.createdAt,
      updatedAt: year.updatedAt
    },

    section
  };

  const safeYearName = createSafeFilename(year.name);
  const safeSectionName = createSafeFilename(section.name);

  downloadJsonFile(
    exportedData,
    `${safeYearName}-${safeSectionName}.json`
  );
}

function formatDateTime(value) {
  if (!value) {
    return "−";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "−";
  }

  return date.toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function createSafeFilename(value) {
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "_");
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      try {
        const parsedData = JSON.parse(reader.result);
        resolve(parsedData);
      } catch (error) {
        reject(
          new Error(
            "Το αρχείο δεν περιέχει έγκυρο JSON."
          )
        );
      }
    };

    reader.onerror = function () {
      reject(
        new Error(
          "Δεν ήταν δυνατή η ανάγνωση του αρχείου."
        )
      );
    };

    reader.readAsText(file, "utf-8");
  });
}

function isValidYearData(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.name === "string" &&
    Array.isArray(data.sections)
  );
}

async function importNewYear(file) {
  if (!file) {
    return;
  }

  try {
    const importedYear = await readJsonFile(file);

    if (!isValidYearData(importedYear)) {
      alert(
        "Το JSON δεν έχει σωστή μορφή σχολικής χρονιάς."
      );
      return;
    }

    const now = new Date().toISOString();

    const newYear = {
      ...importedYear,

      id: createId(),

      name:
        String(importedYear.name).trim() ||
        "Νέα σχολική χρονιά",

      createdAt:
        importedYear.createdAt || now,

      updatedAt: now,

      sections: importedYear.sections.map(
        importedSection => ({
          ...importedSection,

          id: createId(),

          name:
            String(
              importedSection.name || "Τμήμα"
            ).trim(),

          createdAt:
            importedSection.createdAt ||
            importedYear.createdAt ||
            now,

          updatedAt:
            importedSection.updatedAt || now
        })
      )
    };

    years.push(newYear);

    saveYears();
    renderYears();

    yearDialog.close();

    alert("Η σχολική χρονιά εισήχθη επιτυχώς.");
  } catch (error) {
    alert(error.message);
  }
}

importYearFileInput.addEventListener(
  "change",
  async function () {
    const file = importYearFileInput.files[0];

    await importNewYear(file);

    importYearFileInput.value = "";
  }
);

function extractSectionData(data) {
  if (
    data &&
    typeof data === "object" &&
    data.section &&
    typeof data.section === "object"
  ) {
    return data.section;
  }

  if (
    data &&
    typeof data === "object" &&
    typeof data.name === "string"
  ) {
    return data;
  }

  return null;
}

async function importNewSection(file) {
  if (!file) {
    return;
  }

  const selectedYear = years.find(
    year => year.id === selectedYearId
  );

  if (!selectedYear) {
    alert("Δεν βρέθηκε η επιλεγμένη χρονιά.");
    return;
  }

  try {
    const importedData = await readJsonFile(file);

    const importedSection =
      extractSectionData(importedData);

    if (!importedSection) {
      alert(
        "Το JSON δεν έχει σωστή μορφή τμήματος."
      );
      return;
    }

    const now = new Date().toISOString();

    const newSection = {
      ...importedSection,

      id: createId(),

      name:
        String(
          importedSection.name || "Νέο τμήμα"
        ).trim(),

      createdAt:
        importedSection.createdAt || now,

      updatedAt: now,

      students:
        Array.isArray(importedSection.students)
          ? importedSection.students
          : [],

      records:
        importedSection.records &&
        typeof importedSection.records === "object"
          ? importedSection.records
          : {
              absences: [],
              exams: [],
              exercises: [],
              participation: []
            },

      hiddenStatisticsColumns:
        Array.isArray(
          importedSection.hiddenStatisticsColumns
        )
          ? importedSection.hiddenStatisticsColumns
          : []
    };

    selectedYear.sections.push(newSection);
    selectedYear.updatedAt = now;

    saveYears();
    renderYears();

    sectionDialog.close();

    alert("Το τμήμα εισήχθη επιτυχώς.");
  } catch (error) {
    alert(error.message);
  }
}


importSectionFileInput.addEventListener(
  "change",
  async function () {
    const file = importSectionFileInput.files[0];

    await importNewSection(file);

    importSectionFileInput.value = "";
  }
);

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}


function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

