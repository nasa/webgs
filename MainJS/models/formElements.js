/**
 *
 * @module formElements
 * @version 1.0.0
 * @description <b> Communications Module </b>
 *
 *
 * @example none
 * @author Andrew Peters
 * @date May 2020
 * @copyright
 * Notices:
 * Copyright 2019 United States Government as represented by the Administrator of the National Aeronautics
 * and Space Administration. All Rights Reserved.
 *  
 * Disclaimers
 * No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
 * KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY
 * WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
 * INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY
 * WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE.
 * THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT
 * AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE,
 * SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT
 * SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
 * REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND
 * DISTRIBUTES IT "AS IS."
 *  
 * Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED
 * STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR
 * RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES,
 * DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY
 * DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
 * SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES
 * GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT,
 * TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL
 * BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
 *
 */


/**
 * @function <a name="createPlusMinusButtons">createPlusMinusButtons</a>
 * @description Creates HTML Buttons for adding and removing rows.
 * @param id {string} Either ac id, ac id and traffic, or geofence id, point id and aircraft id.
 * @param type {string} ac, fence, traffic
 * @param count {string} row number
 * @param f_a {function} optional: function to add row
 * @param f_r {function} optional: function to remove row
 * @return {object} add button and return button
 * @memberof module:form
 */
export function createPlusMinusButtons(id, type, count, f_a = 0, f_r = 0) {
    let add_button = document.createElement('BUTTON');
    add_button.setAttribute('class', 'btn btn-table add-new-waypoint');
    add_button.setAttribute('id', `add_btn_${type}_${id}_${count}`);
    add_button.setAttribute('type', 'button')
    add_button.innerHTML = '+  ';
    add_button.addEventListener('click', f_a);

    let remove_button = document.createElement('BUTTON');
    remove_button.setAttribute('class', 'btn btn-table remove-waypoint');
    remove_button.setAttribute('id', `remove_btn_${type}_${id}_${count}`);
    remove_button.setAttribute('type', 'button')
    remove_button.innerHTML = '-  ';
    remove_button.addEventListener('click', f_r);
    return {
        add_button,
        remove_button
    };
}

/**
 * @function <a name="addBlockButton">addBlockButton</a>
 * @description Creates button.
 * @param id {string} Either ac id, ac id and traffic, or geofence id, point id and aircraft id.
 * @param type {string} Part of the id.
 * @param text {string} Displayed text.
 * @param f_a {function} click function
 * @return {Object} returns a div containing the button
 * @memberof module:form
 */
export function addBlockButton(id, type, text, click_function) {
    let div = document.createElement('DIV');
    let p = document.createElement('p')
    p.innerHTML = text
    let block_button = document.createElement('BUTTON');
    block_button.setAttribute('class', 'btn btn-block');
    block_button.setAttribute('id', `${type}_btn_${id}`);
    block_button.setAttribute('type', 'button')
    block_button.innerHTML = text
    block_button.addEventListener('click', click_function);
    div.appendChild(block_button);
    return div;
}


export function addFileLoadButton(id, type, text, click_function) {
    // <input type="file" id="filechoice" style="display: none;"></input>
    // <label for="filechoice" class="btn btn-primary label" type="button" id="file_label">Load File</label>
    let div = document.createElement('DIV');
    let file_input = document.createElement('INPUT');
    file_input.setAttribute('style', 'display:none;');
    file_input.setAttribute('id', `${type}_file_${id}`);
    file_input.setAttribute('type', 'file')


    let file_label = document.createElement('LABEL')
    file_label.setAttribute('for', `${type}_file_${id}`)
    file_label.setAttribute('class', 'btn btn-block')
    file_label.setAttribute('type', 'button')
    file_label.setAttribute('id',`${type}_label_${id}`)
    file_label.innerHTML = text

    file_input.addEventListener('change', click_function);

    div.appendChild(file_input);
    div.appendChild(file_label)
    return div;
}


/**
 * @function <a name="addTextInput">addTextInput</a>
 * @description Creates text input and label.
 * @param id {string} Part of the id.
 * @param text {string} Displayed text next to the input.
 * @param value {string} Start value.
 * @param onInput_function {function} optional: input function
 * @return {Object} returns a div containing the input and label
 * @memberof module:form
 */
export function addTextInput(id, text, value, onInput_function = 'none') {
    let alt_div = document.createElement('div');
    alt_div.setAttribute('id', `alt_div_${id}`);

    let p = document.createElement('P');
    p.setAttribute('class', 'input_label')
    p.innerHTML = text
    alt_div.appendChild(p)

    let input_alt = document.createElement("INPUT");
    input_alt.setAttribute('type', 'text');
    input_alt.setAttribute('class', 'input_class');
    input_alt.setAttribute('value', value);
    input_alt.setAttribute('id', `${id}_input`);
    if (onInput_function !== 'none') {
        input_alt.addEventListener('keyup', function (e) {
            onInput_function(e)
        })
    }
    alt_div.appendChild(input_alt);
    return alt_div;
}

/**
 * @function <a name="addTextInput">addTextInput</a>
 * @description Creates text input and label.
 * @param id {string} Part of the id.
 * @param name {string} Part of the id.
 * @param text {string} Displayed text next to the input.
 * @param value {string} Start value.
 * @param onInput_function {function} optional: input function
 * @return {Object} returns a div containing the input and label
 * @memberof module:form
 */
export function addNumberInput(id, name, text, step, size, value, onInput_function = 'none') {
    let alt_div = document.createElement('div');
    alt_div.setAttribute('id', `alt_div_${id}`);

    let p = document.createElement('P');
    p.setAttribute('class', 'input_label')
    p.innerHTML = text;
    alt_div.appendChild(p)

    let input_alt = document.createElement("INPUT");
    input_alt.setAttribute('type', 'number');
    input_alt.setAttribute('step', step);
    input_alt.setAttribute('class', 'input_class');
    input_alt.setAttribute('size', size);
    input_alt.setAttribute('id', `${name}_${text}_${id}`);
    if (onInput_function !== 'none') {
        input_alt.addEventListener('keyup', function (e) {
            onInput_function(e)
        })
    }
    input_alt.defaultValue = value;
    alt_div.appendChild(input_alt);
    return alt_div;
}

/**
 * @function <a name="addButtonSwitch">addButtonSwitch</a>
 * @description Creates on/off toggle buttons.
 * @param name {string} Part of the id.
 * @param text {string} Displayed text next to the input.
 * @param onInput_function {function} optional: input function
 * @return {Object} returns a div containing the buttons and label
 * @memberof module:form
 */
export function addButtonSwitch(name, text, onInput_function = 'none') {

    let toggle_div = document.createElement('div');
    toggle_div.setAttribute('id', `alt_div_${name}`);

    let p = document.createElement('P');
    p.setAttribute('class', 'input_label')
    p.innerHTML = text;
    toggle_div.appendChild(p)

    let button_on = document.createElement("BUTTON");
    let button_off = document.createElement("BUTTON");

    button_on.setAttribute('class', 'toggle_class');
    button_off.setAttribute('class', 'toggle_class');
    button_on.setAttribute('id', `${name}_on`);
    button_off.setAttribute('id', `${name}_off`);
    button_on.innerHTML = 'On';
    button_off.innerHTML = 'Off'

    if (onInput_function !== 'none') {
        button_on.addEventListener('click', onInput_function)
        button_off.addEventListener('click', onInput_function)
    }

    toggle_div.appendChild(button_on);
    toggle_div.appendChild(button_off);
    return toggle_div;
}

/**
 * @function <a name="addRadioButtonGroup">addRadioButtonGroup</a>
 * @description Creates a group of radio buttons.
 * @param name {string} Pard of the id.
 * @param text {string} Displayed text next to the input.
 * @param in_array {Array} Array[string] of button labels.
 * @param onInput_function {function} optional: input function
 * @return {Object} returns a div containing the buttons
 * @memberof module:form
 */
export function addRadioButtonGroup(name, text, in_array, checked, onInput_function = null) {
    let radio_div = document.createElement('div')
    radio_div.setAttribute('id', `alt_div_${name}`)

    let p = document.createElement('P')
    p.setAttribute('class', 'radio_text')
    p.innerHTML = text;
    radio_div.appendChild(p)

    let label
    let radio
    for (let item of in_array) {

        radio = document.createElement('INPUT')
        radio.setAttribute('class', `radio_${name}`)
        radio.setAttribute('type', 'radio')
        radio.setAttribute('name', name)
        radio.setAttribute('value', item)
        if (checked == item) {
            radio.checked = true
        }
        radio.onclick = onInput_function
        radio_div.appendChild(radio)

        label = document.createElement('Label')
        label.setAttribute('class', 'radio')
        label.setAttribute('for', radio)
        label.innerHTML = item

        radio_div.appendChild(label)
    }
    return radio_div
}

/**
 * @function <a name="alertBannerGreen">alertBannerGreen</a>
 * @description Creates green alert baner.
 * @param text {string} Displayed text.
 * @memberof module:form
 */
export function alertBannerGreen(text) {

    let banner = document.createElement('div')
    banner.setAttribute('id', 'alertBanner')
    banner.setAttribute('class', 'g_overlay')
    let b_text = document.createElement('div')
    b_text.setAttribute('id', 'g_text')
    b_text.innerHTML = text
    banner.appendChild(b_text)
    document.getElementById('banner_group').appendChild(banner)
    setTimeout(function () {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner)
        }
    }, 3000)
}

/**
 * @function <a name="alertBannerRed">alertBannerRed</a>
 * @description Creates red alert baner.
 * @param text {string} Displayed text.
 * @memberof module:form
 */
export function alertBannerRed(text) {

    let banner = document.createElement('div')
    banner.setAttribute('id', 'alertBanner')
    banner.setAttribute('class', 'r_overlay')
    let b_text = document.createElement('div')
    b_text.setAttribute('id', 'r_text')
    b_text.innerHTML = text
    banner.appendChild(b_text)
    document.getElementById('banner_group').appendChild(banner)
    setTimeout(function () {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner)
        }
    }, 5000)
}


/**
 * @function <a name="alertBanneryellow">alertBannerYellow</a>
 * @description Creates yellow alert baner.
 * @param text {string} Displayed text.
 * @memberof module:form
 */
export function alertBannerYellow(text) {

    let banner = document.createElement('div')
    banner.setAttribute('id', 'alertBanner')
    banner.setAttribute('class', 'y_overlay')
    let b_text = document.createElement('div')
    b_text.setAttribute('id', 'y_text')
    b_text.innerHTML = text
    banner.appendChild(b_text)
    document.getElementById('banner_group').appendChild(banner)
    setTimeout(function () {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner)
        }
    }, 5000)
}


/**
 * @function <a name="alertBannerOrange">alertBannerOrange</a>
 * @description Creates Orange alert baner.
 * @param text {string} Displayed text.
 * @memberof module:form
 */
export function alertBannerOrange(text) {
    let banner = document.createElement('div')
    banner.setAttribute('id', 'alertBanner')
    banner.setAttribute('class', 'o_overlay')
    let b_text = document.createElement('div')
    b_text.setAttribute('id', 'o_text')
    b_text.innerHTML = text
    banner.appendChild(b_text)
    document.getElementById('banner_group').appendChild(banner)
    setTimeout(function () {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner)
        }
    }, 5000)
}


export function addParagraph(id, text, c=0) {
    let p = document.createElement('p')
    if(id != '') {
        p.setAttribute('id', id)
    }
    p.setAttribute('class', c)
    p.innerHTML = text
    return p
}

export function addHFive(id, text, c=0) {
    let h5 = document.createElement('h5')
    h5.setAttribute('id', id)
    h5.setAttribute('class', c)
    h5.innerHTML = text
    return h5
}

export function addDiv(id, c = 0) {
    let d = document.createElement('div')
    d.setAttribute('id', id)
    d.setAttribute('class', c)
    return d
}

export function addForm(id, c = 0) {
    let f = document.createElement('form')
    f.setAttribute('id', id)
    f.setAttribute('class', c)
    return f
}

export function addTable(id, c=0) {
    let t = document.createElement('table')
    t.setAttribute('id', id)
    t.setAttribute('class', c)
    return t
}

export function addRow(id, c=0){
    let r = document.createElement('tr')
    r.setAttribute('id', id)
    r.setAttribute('class', c)
    return r
}

export function addInput(type, step, value, id, c, e=0) {
    let i = document.createElement("INPUT");
    i.setAttribute('type', type);
    i.setAttribute('step', step);
    i.setAttribute('class', c);
    i.setAttribute('id', id);
    i.value = value
    if (e != 0) {
        i.addEventListener('input',e)
    }
    return i
}

export function addPlaybackInput(id, c, ty, src, click) {
    let play = document.createElement('input')
    play.setAttribute('id', id)
    play.setAttribute('class', c)
    play.setAttribute('type', ty)
    play.setAttribute('src', src)
    play.addEventListener('click', click)
    return play
}

export function addTextArea(id, c, wrap,row, col) {
    let t = document.createElement('textarea')
    t.setAttribute('id', id)
    t.setAttribute('class', c)
    t.setAttribute('wrap', wrap)
    t.rows = row
    t.cols = col
    return t
}

export function addSelectionBox(id, c, auto) {
    let s = document.createElement('select')
    s.setAttribute('id', id)
    s.setAttribute('class', c)
    s.setAttribute('autofocus', auto)
    return s
}

export function addOption(v, i) {
    let o = document.createElement('option')
    o.setAttribute('value', v)
    o.innerHTML = i
    return o
}

export function addLink(href, i) {
    let a = document.createElement('a')
    a.setAttribute('href', href)
    a.innerHTML = i
    return a
}

export function addImage(id, c, src) {
    let im = document.createElement('IMG');
    im.setAttribute("id", id);
    im.setAttribute("src", src);
    im.setAttribute('class', c)
    return im
}

export function addSpan(id, c=0) {
    let s = document.createElement('span')
    s.setAttribute('id', id)
    if (c !=0) {
        s.setAttribute('class', c)
    }
    return s
}

export function addUnorderedList(id, c) {
    let u = document.createElement('ul')
    u.setAttribute('id', id)
    u.setAttribute('class', c)
    return u
}

export function addListItem() {
    return document.createElement('li')
}

export function removeChildren(d) {
    let last
    if (d) {
        while (last = d.lastChild) {
            d.removeChild(last)
        }
    }
}

export function removeElement(e) {
    if (e) {
        e.parentNode.removeChild(e)
    }
}
