function saveResponses(csv) {
    try {
        chrome.storage.local.set({ ENTRIES: parseCSV(csv) }, onLoad);
    } catch (e) {
        console.warn(e.message)
    }
}

function fetchResponses() {
    // fetch config with all custom attributes like CSV_URL etc
    chrome.storage.local.get("CSV_URL", (result) => {
        const url = result?.CSV_URL ? getCSVURL(result?.CSV_URL) : CSV_URL_DEFAULT;
        fetch(url)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.warn('Looks like there was a problem. Status Code: ', response.status);
                        return;
                    }
                    // convert csv to json and save to local storage
                    response.text().then(saveResponses)
                }
            )
            .catch(function (err) {
                console.log('Fetch Error :-S', err);
            });
    })
}
fetchResponses();
function setLanguage(langEvent = null) {
    //return 0;
    chrome.storage.local.get("language", function (result) {
        let lang = "en"; // default language is english
        if (langEvent) { // if lang set by button
            lang = langEvent.srcElement.value;
        } else if (!objectIsEmpty(result["language"])) { // if lang set before
            lang = result["language"];
        }
        let currentLanguage = langLib[lang];
        let textElements = document.querySelectorAll("[data-lang]");
        // chrome.storage.local.set({ "language": lang }, function () {
        //     console.log("Language set: " + lang);
        // });
        for (let i = 0; i < textElements.length; i++) {
            let originalValue = textElements[i].getAttribute("data-lang");
            textElements[i].innerHTML = currentLanguage[originalValue] || originalValue;
        }
    });
}

function addNewEntry(key = "", val = "") {
    if (typeof (key) != "string") {
        key = "";
    }
    // Fix for the problem of deleting when a new entry is insert
    let currInputs = document.querySelectorAll('input[type="text"]');
    for (let i = 0; i < currInputs.length; i++) {
        currInputs[i].setAttribute("value", currInputs[i].value);
    }
    // document.getElementsByTagName("tbody")[0]
    document.querySelector('#tbody_responses').innerHTML += '\
        <tr>\
            <td><input  type="text" class="form-control text-truncate" value="' + key + '"></td>\
            <td><input type="text" class="form-control" value="' + val + '"></td>\
        </tr>';
    return false;
}
function addNextQuestion() {
    removeAllInputs();
    chrome.storage.local.get("formData", (res) => {
        const { entryId = 0 } = res.formData || {};
        chrome.storage.local.get("ENTRIES", ({ ENTRIES }) => {
            const formData = ENTRIES[entryId] || {}
            formData.entryId = parseInt(entryId) + 1;
            if (formData.entryId >= ENTRIES.length) {
                formData.entryId = 0
                alert("Done submitting all responses");
            }
            chrome.storage.local.set({ formData }, onLoad);
        })
    })
}
function addPreviousQuestion() {
    removeAllInputs();
    chrome.storage.local.get("formData", (res) => {
        const { entryId = 0 } = res.formData || {};
        chrome.storage.local.get("ENTRIES", ({ ENTRIES }) => {

            const formData = ENTRIES[entryId] || {}
            formData.entryId = entryId - 1;
            if (formData.entryId >= ENTRIES.length || formData.entryId <= -1) {
                if (formData.entryId <= -1) {
                    alert("Resetting inputs and starting from the beginning");
                } else {
                    alert("Done submitting all responses and starting from the beginning");
                }
                formData.entryId = 0
            }
            chrome.storage.local.set({ formData }, onLoad);
        })
    })
}

function updateForm() {
    saveData();
}

function selectQuestion() {
    const key = document.getElementById("selectedQuestion").value;
    addNewEntry(key, "");
}

function updateQuestions(formData) {
    /*
        TODO:remove the fields which already have values in form data
    */

    const selectedQuestion = document.getElementById("selectedQuestion");
    if (!formData) {
        formData = {}
    }
    const filledQuestions = Object.keys(formData)
    questions.filter(q => !filledQuestions.includes(q)).map(question => {
        let option = document.createElement('option');
        option.value = option.text = question;
        selectedQuestion.add(option);
    })
}

function removeAllInputs() {
    let inputs = document.querySelectorAll('input[type="text"]');
    for (let i = 0; i < inputs.length / 2; i++) {
        inputs[i * 2].parentNode.parentNode.remove();
    }
}

function saveData(entryId = undefined) {
    let saveButton = document.getElementById("saveDataButton");
    let savedText = document.getElementById("savedText");
    saveButton.disabled = true;
    let inputs = document.querySelectorAll('input[type="text"]');
    // console.log("inputsCount", inputs.length)
    let formData = {};
    for (let i = 0; i < inputs.length / 2; i++) {
        if (inputs[i * 2].value && inputs[i * 2 + 1].value) {
            formData[inputs[i * 2].value.trim()] = inputs[i * 2 + 1].value.trim();
        } else {
            inputs[i * 2].parentNode.parentNode.remove();
        }
    }
    saveButton.disabled = false;
    savedText.style.opacity = 1;
    let opacityInterval = setInterval(() => {
        savedText.style.opacity -= 0.01;
        if (savedText.style.opacity == 0) {
            clearInterval(opacityInterval);
        }
    }, 10);
    // run the content script now
    //return 0;
    chrome.storage.local.get("formData", (res) => {
        entryId = entryId || formData?.entryId || res.formData?.entryId;
        formData.entryId = parseInt(entryId || 0)
        chrome.storage.local.set({ formData }, function () {
            console.log("Form data saved: ", formData);
        });
        chrome.tabs.executeScript({
            // file: "src/ClickForm.js;",
            code: "FillForms();",
            allFrames: true,
        });
    })
}

function objectIsEmpty(object) {
    let isEmpty = true;
    if (!object) {
        isEmpty = true;
    } else if (JSON.stringify(object) === JSON.stringify({})) {
        isEmpty = true;
    } else {
        isEmpty = false;
    }
    return isEmpty;
}

function updateCSV_URL() {
    const url = document.getElementById("CSV_URL").value
    chrome.storage.local.set({ CSV_URL: url }, fetchResponses);
    alert("URL updated to: " + url)
}

function updateAutoSubmit() {
    const input = document.querySelector('input[name="autoSubmit"]:checked');
    const autoSubmit = input?.value || '0';
    // save autosubmit;
    chrome.storage.local.set({ autoSubmit });
}

function onLoad() {
    removeAllInputs();
    setLanguage();
    // Add click listeners to language buttons
    const langButtons = document.querySelectorAll("#selectLang>input");
    for (let i = 0; i < langButtons.length; i++) {
        langButtons[i].addEventListener("click", setLanguage, false);
    }
    // Add click listeners to add and save button
    document.getElementById("addNextQuestion").addEventListener("click", addNextQuestion, false);
    document.getElementById("addPreviousQuestion").addEventListener("click", addPreviousQuestion, false);
    document.getElementById("selectQuestion").addEventListener("click", selectQuestion, false);
    document.getElementById("saveDataButton").addEventListener("click", updateForm, false);
    document.getElementById("autoSubmit").addEventListener("click", updateAutoSubmit, false);
    document.getElementById("CSV_URL_SAVE").addEventListener("click", updateCSV_URL, false);
    chrome.storage.local.get('autoSubmit', (res) => {
        const autoSubmit = res?.autoSubmit || '0'
        const radiobtn = document.getElementById(`autoSubmit${autoSubmit}`);
        radiobtn.checked = true;
    });

    chrome.storage.local.get("CSV_URL", (res) => {
        // display the current google spreadsheet url
        if (res.CSV_URL) {
            document.querySelector('#CSV_URL').setAttribute('value', res.CSV_URL)
        }
    })

    chrome.storage.local.get("formData", ({ formData } = {}) => {
        chrome.storage.local.get("ENTRIES", ({ ENTRIES }) => {
            const { entryId = 0 } = formData || {};
            const _formData = ENTRIES[entryId] || formData;
            if (objectIsEmpty(_formData)) {
                addNewEntry();
            } else {
                _formData.entryId = entryId;
                for (key in _formData) {
                    _formData[key] && addNewEntry(key, _formData[key]);
                }
            }
            updateQuestions(_formData);
        });
    });
}

window.onload = onLoad()