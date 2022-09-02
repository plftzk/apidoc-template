const cTpl = `<div id="configModalBtn" data-toggle="modal" style="width:60px;height:30px;line-height:30px;text-align:center;cursor:pointer;position:fixed;top:0;left:20%;background:#eee;">
    <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
</div>
<div id="configModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="myModalLabel">Config</h4>
            </div>
            <div class="modal-body">
            <form>
                <div class="form-group">
                    <label for="configHost" class="control-label">Host:</label>
                    <input type="text" class="form-control" id="configHost">
                </div>
                <div id="configHeaderGroup"></div>
                <div class="form-group">
                    <label for="docInitScript" class="control-label">Doc init script:</label>
                    <textarea class="form-control" rows="5" id="docInitScript"></textarea>
                    <button type="button" class="btn btn-default btn-sm" style="margin-top: 10px" id="useScriptTplBtn">Script template</button>
                </div>
            </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="configSave">Save</button>
            </div>
        </div>
    </div>
</div>`;

const scriptTpl = `const auth_data = JSON.stringify({username: 'jack', password: '123456'});
// request auth info.
$.ajax({
    url: 'http://127.0.0.1:16888/api/login',
    method: 'post',
    data: auth_data,
    headers: {'Content-Type': 'application/json'},
    type: 'json',
    dataType: 'json',
    processData: false,
    success(resp) {
        if (resp.code === 0) {
            $('input[data-name="token"]').val(resp.data.token);
            docInitCallbackFunc(); //  * Need to keep!!!
        }
    }
});`;

let _configUrls;
let _configLastHost;
let _configHeaderArray;
const _configVarMap = {};
const _configPtn = new RegExp('//(.*?)/');

function useScriptTpl() {
    $('#docInitScript')
        .val(scriptTpl);
}

window.docInitCallbackFunc = function() {
    for (const key in _configVarMap) {
        const val = $('input[data-name="' + key + '"]')
            .val();
        const inputId = `configKey${key}`;
        $('#' + inputId)
            .val(val);
    }
};

function _configOnload() {
    const initScriptStr = localStorage.getItem('initScript');
    if (typeof initScriptStr === 'string') {
        $('#docInitScript')
            .val(initScriptStr);
        window.eval(initScriptStr);
    }

    _configUrls = $('.sample-request-url');

    const requestHostStr = localStorage.getItem('requestHost');
    if (typeof requestHostStr === 'string') {
        _configLastHost = requestHostStr;
        for (let i = 0; i < _configUrls.length; i++) {
            const $urlInput = $(_configUrls[i]);
            let url = $urlInput.val();
            url = url.replace(_configPtn, `//${requestHostStr}/`);
            $urlInput.val(url);
        }
    } else {
        if (_configUrls.length > 0) {
            const $urlInput = $(_configUrls[0]);
            const url = $urlInput.val();
            const matches = url.match(_configPtn);
            if (matches.length === 2) {
                _configLastHost = matches[1];
            }
        }
    }

    const headerSet = new Set();
    $('[data-family="header"]')
        .each(function() {
            const headerName = $(this)
                .data('name');
            headerSet.add(headerName);
        });
    if (headerSet.size) {
        _configHeaderArray = Array.from(headerSet);
        for (let i = 0; i < _configHeaderArray.length; i++) {
            const key = _configHeaderArray[i];
            const inputId = `configKey${key}`;
            _configVarMap[key] = {inputId};
        }
    }
}

function addConfigHeaderGroup() {
    const _tplArr = [];
    for (const key in _configVarMap) {
        const {inputId} = _configVarMap[key];
        _tplArr.push(`<div class="form-group"><label for="${inputId}" class="control-label">Header parameter ${key}:</label><textarea class="form-control" id="${inputId}"></textarea></div>`);
    }
    $('#configHeaderGroup')
        .html(_tplArr.join(''));
}

export function InitConfigHelper() {
    $('body')
        .append(cTpl);
    _configOnload();
    if (_configLastHost) {
        $('#configHost')
            .val(_configLastHost);
    }
    $('#configModalBtn')
        .click(function() {
            $('#configModal')
                .modal('toggle');
        });

    $('#useScriptTplBtn')
        .on('click', function() {
            useScriptTpl();
        });

    addConfigHeaderGroup();

    $('#configSave')
        .click(function() {
            for (const key in _configVarMap) {
                const inputId = `configKey${key}`;
                const val = $('#' + inputId)
                    .val();
                $('input[data-name="' + key + '"]')
                    .val(val);
            }
            const host = $('#configHost')
                .val();
            if (host) {
                localStorage.setItem('requestHost', host);
            }

            const initScriptStr = $('#docInitScript')
                .val();
            if (initScriptStr !== '') {
                localStorage.setItem('initScript', initScriptStr);
                if (window.confirm('Page will reload.') === true) {
                    location.reload();
                }
            }

            $('#configModal')
                .modal('hide');
        });
}
