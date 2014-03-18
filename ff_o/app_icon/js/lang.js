var get_lang = function(lang) {
    var lang_arr_en = {
        t: 'en',
        'btn_form': 'Search',
        'btn_filter': 'Clear'
    };
    var lang_arr_ru = {
        t: 'ru',
        'btn_form': 'Найти',
        'btn_filter': 'Очистить'
    };
    if (lang === undefined) {
        lang = 'en';
        if (window.chrome !== undefined && chrome.i18n && chrome.i18n.getMessage("lang") === 'ru') {
            lang = 'ru';
        }
    }
    if (lang === 'ru') {
        return lang_arr_ru;
    } else {
        return lang_arr_en;
    }
};
var _lang = get_lang();
window.addEventListener("load",function(){
    if (window.options !== undefined) {
        return;
    }
    window.get_lang = undefined;
});