async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
    return array
}

const getResponses = () => {
    const questions = getQuestions();
    let responses = {}
    questions.forEach(function (item) {
        let formTitle = item.querySelector("label").textContent.trim();
        let inputValue = "";
        if (item.querySelector("textarea,input")) {
            inputValue = item.querySelector("textarea,input").value;
        } else if (item.querySelector(".cu-custom-fields__dropdown-text") ||
            item.querySelector(".cu-select-selection__text")
        ) {
            if (item.querySelector(".cu-custom-fields__dropdown-text")) {
                inputValue = item.querySelector(".cu-custom-fields__dropdown-text").textContent;
            }
            if (!inputValue && item.querySelector(".cu-custom-fields__labels-item-text")) {
                inputValue = [] //change to array so can push
                item.querySelectorAll(".cu-custom-fields__labels-item-text").forEach(option => {
                    inputValue.push(option.textContent.trim())
                })
            }
        }
        if (inputValue) responses[formTitle] = inputValue
    })
    return responses
}

const hideItem = (item) => {
    item.style.display = "none";
}

const getIntersection = (x, y) => {
    let a = new Set(x)
    let b = new Set(y)
    let intersect = new Set([...a].filter(i => b.has(i)));
    return [...intersect];
}


function hideOrShowFields(formData) {
    /*
        iterate over all form inputs and fill them accordingly depending on the input of the formData
    */
    const responses = { ...getResponses(), ...formData }
    const questions = getQuestions();
    const updateTypes = ((responses[UPDATE_TYPES_LABEL] && responses[UPDATE_TYPES_LABEL].split(";")) || []).map(type => type.trim())

    questions.forEach(function (item) {
        let formTitle = item.querySelector("label").textContent.trim();
        // console.log("formTitle", formTitle);
        if (!alwaysVisibleFields.includes(formTitle)) {
            // hide item if formTitle is not 
            const visibleForUpdateTypes = conditionalFields[formTitle] || [];
            // hide if these sets do not interset in any way
            const intersections = getIntersection(visibleForUpdateTypes, updateTypes);
            if (!intersections.length > 0) {
                hideItem(item);
            } else {
                item.style.display = "block";
            }
        }
    })
}

// Returns a Promise that resolves after "ms" Milliseconds
const sleep = ms => new Promise(res => setTimeout(res, ms))

const writeInput = async ({ input, text } = {}) => {
    /*
        immitates typing in an input and then fire all relevant events
    */
    input.focus(); // you can also use input.select()
    input.value = "";
    const time = 10;

    await asyncForEach(Object.keys(text), async (current) => {
        input.value += text[current];
        await sleep(time)
    })
    input.setAttribute('value', text);
    await sleep(time);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(time);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(time);
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    return input;
}



function click(selection) {
    let clickEvent = new Event('click');
    return selection.dispatchEvent(clickEvent);
}

const validateQuestion = async (item, formData) => {
    const formTitle = item.querySelector("label").textContent.trim(); //item.getAttribute("data-params").split(",")[1].slice(1, -1);
    const answer = formData[formTitle];
    const isDropdownMenu = (item.querySelector(".cu-select__dropdown-menu-option") || item.querySelector(".cu-select-option"));
    DEBUG && console.log("validate102 ", formTitle)
    if (answer) { // if the input is text and answer exist
        const input = item.querySelector("input,textarea");
        const answers = answer.split(";");
        const dateInput = item.querySelector(".cu-form__date-picker-input")
        if (dateInput) {
            // this will show the date input
            dateInput.click()
            await sleep(200);
            document.querySelector(`[aria-label='${answer}']`).click()
        }
        else if (input && !isDropdownMenu) {
            await writeInput({ input, text: answer });
        } else {
            let selectionOptions = item.querySelector(".cu-select-option");
            const selectionBox = item.querySelector(".cu-select-selection__text");
            const clickChoice = async (selectionOptions) => {
                // console.log("cu-select-option102", selectionOptions);
                if (selectionBox) {
                    // this helps display selection options;
                    selectionBox.click();
                }
                // get the just showed selection options;
                if (!selectionOptions) {
                    selectionOptions = item.querySelector(".cu-select-option");
                }
                // only click this if the selection box was not clicked;
                !selectionBox && selectionOptions.click();
                await sleep(500);
                // console.log("selectionOptions103", formTitle, selectionOptions)
                const options = item.querySelectorAll("cu-select-option");
                // console.log(options);
                options.forEach(async (o) => {
                    let textContent = o.textContent && o.textContent.trim();
                    const selection = o.querySelector(".cu-select-option");
                    const innerSelection = item.querySelector(".cu-select-selection__text-inner");
                    const selectedValue = innerSelection && innerSelection.textContent.trim();
                    // split possibile options and set them here
                    const isSelected = !selectedValue ? !!selection.querySelector(".icon") : textContent === selectedValue
                    // console.log("textContent", textContent, "selectedValue",selectedValue, answers, isSelected);
                    if (textContent) {
                        if (answers.includes(textContent)) {
                            // only click if not select
                            if (!isSelected) {
                                await click(selection)
                            }
                        } else {
                            // unselect by clicking it again
                            if (isSelected) {
                                await click(selection)
                            }
                        }
                    }
                })
                if (item.querySelector(".cu-dropdown__menu")) {
                    item.querySelector(".cu-dropdown__menu").style.height = '0px';
                }
                return options;
            }
            if (selectionBox || selectionOptions) {
                await sleep(10);
                const choices = await clickChoice();
                if (choices.length === 0) {
                    //call twice if not options
                    await sleep(10);
                    await clickChoice();
                }
            }
        }
    }
    return item;
}

function getQuestions() {
    return document.querySelectorAll(".cu-form__body-item");
}

async function submitForm() {
    const submit = document.querySelector(".cu-form__submit");
    submit && submit.click()
    await sleep(100);
    if (document.querySelector(".cu-form")) {
        // reload iframe
        const interval = setInterval(async () => {
            const iframe = document.querySelector(".cu-form");
            if (iframe &&
                iframe.querySelector(".ql-align-center") &&
                iframe.querySelector(".ql-align-center").textContent.trim() === "Thank You!") {
                clearInterval(interval);
                await sleep(100);
                document.location.reload()
                //console.log("Cleared interval too");
            } else {
                //console.log("no iframe or not submitted")
            }
        }, 600)

        setTimeout(() => {
            if (interval) {
                // console.log("Set timeout clear interval ", interval);
                clearInterval(interval);
            }
        }, 40e3)
    } else {
        console.log("no iframe")
    }
}


async function FillForms() {
    // update the clickup form with the saved responses
    chrome.storage.local.get("formData", async ({ formData }) => {
        const questions = getQuestions(); //cu-form__body-item
        await asyncForEach(questions, async (question) => {
            await validateQuestion(question, formData)
            await sleep(50);
        })
        await sleep(500);
        hideOrShowFields(formData);
        await sleep(500);
        chrome.storage.local.get('autoSubmit', async ({ autoSubmit }) => {
            if (autoSubmit === '1') {
                await submitForm()
            }
        });
    });
}

