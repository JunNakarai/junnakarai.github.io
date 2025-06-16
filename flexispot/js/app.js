// FlexiSpot Web Controller - Main Application
class FlexiSpotWebController {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.currentHeight = 0;
        this.upInterval = null;
        this.downInterval = null;
        this.dataBuffer = [];
        this.heightMonitoringInterval = null;

        // FlexiSpotコマンド定義
        this.commands = {
            WAKE_UP: new Uint8Array([0x9b, 0x06, 0x02, 0x00, 0x00, 0x6c, 0xa1, 0x9d]),
            UP: new Uint8Array([0x9b, 0x06, 0x02, 0x01, 0x00, 0xfc, 0xa0, 0x9d]),
            DOWN: new Uint8Array([0x9b, 0x06, 0x02, 0x02, 0x00, 0x0c, 0xa0, 0x9d]),
            PRESET_1: new Uint8Array([0x9b, 0x06, 0x02, 0x04, 0x00, 0xac, 0xa3, 0x9d]),
            PRESET_2: new Uint8Array([0x9b, 0x06, 0x02, 0x08, 0x00, 0xac, 0xa6, 0x9d]),
            PRESET_3: new Uint8Array([0x9b, 0x06, 0x02, 0x10, 0x00, 0xac, 0xac, 0x9d]),
            PRESET_4: new Uint8Array([0x9b, 0x06, 0x02, 0x00, 0x01, 0xac, 0x60, 0x9d])
        };

        // モジュールの初期化
        this.serial = new SerialCommunication(this);
        this.control = new DeskControl(this);

        this.initializeUI();
        this.checkBrowserSupport();
    }

    checkBrowserSupport() {
        const checkDiv = document.getElementById('browser-check');
        if ('serial' in navigator) {
            checkDiv.className = 'browser-check supported';
            checkDiv.innerHTML = '<strong>✅ ブラウザ対応</strong><br>このブラウザはWeb Serial APIをサポートしています。';
        } else {
            checkDiv.className = 'browser-check unsupported';
            checkDiv.innerHTML = '<strong>❌ ブラウザ未対応</strong><br>Chrome 89+またはEdge 89+をお使いください。FirefoxやSafariは現在対応していません。';
        }
    }

    initializeUI() {
        // 接続ボタン
        document.getElementById('connect-btn').addEventListener('click', () => this.connect());
        document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());

        // プリセットボタン
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`preset-${i}`).addEventListener('click', () => this.control.setPreset(i));
        }

        // 上下ボタン（長押し対応）
        this.setupControlButtons();

        // その他のボタン
        document.getElementById('clear-log-btn').addEventListener('click', () => this.clearLog());
        
        // デバッグボタン
        document.getElementById('debug-wake1').addEventListener('click', () => {
            this.serial.sendCommand(this.commands.WAKE_UP);
            this.log('🔧 デバッグ: WAKE_UP送信', 'info');
        });
        document.getElementById('debug-status').addEventListener('click', () => {
            this.log(`🔧 デバッグ: 接続状態=${this.isConnected}, 高さ=${this.currentHeight}cm`, 'info');
        });
        document.getElementById('update-interval').addEventListener('click', () => {
            const interval = parseInt(document.getElementById('monitor-interval').value);
            this.control.updateMonitoringInterval(interval);
        });
    }

    setupControlButtons() {
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');

        // 上ボタン
        upBtn.addEventListener('mousedown', () => this.control.startMoveUp());
        upBtn.addEventListener('mouseup', () => this.control.stopMoveUp());
        upBtn.addEventListener('mouseleave', () => this.control.stopMoveUp());
        upBtn.addEventListener('touchstart', () => this.control.startMoveUp());
        upBtn.addEventListener('touchend', () => this.control.stopMoveUp());

        // 下ボタン
        downBtn.addEventListener('mousedown', () => this.control.startMoveDown());
        downBtn.addEventListener('mouseup', () => this.control.stopMoveDown());
        downBtn.addEventListener('mouseleave', () => this.control.stopMoveDown());
        downBtn.addEventListener('touchstart', () => this.control.startMoveDown());
        downBtn.addEventListener('touchend', () => this.control.stopMoveDown());
    }

    async connect() {
        if (!('serial' in navigator)) {
            this.log('Web Serial APIがサポートされていません', 'error');
            return;
        }

        try {
            this.port = await navigator.serial.requestPort();

            await this.port.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                bufferSize: 1024,
                flowControl: 'none'
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
            this.isConnected = true;

            this.updateConnectionUI(true);
            this.log('FlexiSpotデスクに接続しました', 'success');

            this.serial.startReading();
            this.control.initializeDesk();

        } catch (error) {
            this.log(`接続エラー: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            await this.reader.releaseLock();
        }
        if (this.writer) {
            await this.writer.releaseLock();
        }
        if (this.port) {
            await this.port.close();
        }

        this.control.stopMoveUp();
        this.control.stopMoveDown();
        this.control.stopHeightMonitoring();
        this.isConnected = false;
        this.dataBuffer = [];

        this.updateConnectionUI(false);
        this.log('接続を切断しました', 'success');
    }

    updateConnectionUI(connected) {
        document.getElementById('connect-btn').disabled = connected;
        document.getElementById('disconnect-btn').disabled = !connected;
        document.getElementById('status-text').textContent = connected ? '接続済み' : '未接続';
        if (!connected) {
            document.getElementById('current-height').textContent = '-- cm';
        }
    }

    updateHeightDisplay(height) {
        this.currentHeight = height;
        document.getElementById('current-height').textContent = `${height} cm`;
    }

    log(message, type = 'info') {
        const logDiv = document.getElementById('log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    clearLog() {
        document.getElementById('log').innerHTML = '';
        this.log('ログをクリアしました');
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    window.flexiSpotController = new FlexiSpotWebController();
});
