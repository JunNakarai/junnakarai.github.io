// FlexiSpot Desk Control Module
class DeskControl {
    constructor(controller) {
        this.controller = controller;
        this.serial = new SerialCommunication(controller);
    }

    async initializeDesk() {
        this.controller.log('🔧 デスクを初期化中...', 'info');

        await new Promise(resolve => setTimeout(resolve, 500));

        await this.serial.sendCommand(this.controller.commands.WAKE_UP);
        this.controller.log('🔔 WAKE_UP送信', 'info');

        setTimeout(() => {
            this.startHeightMonitoring();
        }, 1000);
    }

    startHeightMonitoring() {
        if (this.controller.heightMonitoringInterval) {
            clearInterval(this.controller.heightMonitoringInterval);
        }

        setTimeout(() => {
            this.serial.sendCommand(this.controller.commands.WAKE_UP);
            this.controller.log('🔔 高さデータ要求を送信しました', 'info');
        }, 500);

        this.controller.heightMonitoringInterval = setInterval(() => {
            if (this.controller.isConnected) {
                this.serial.sendCommand(this.controller.commands.WAKE_UP);
                this.controller.log('🔄 高さデータ要求を送信中...', 'info');
            }
        }, 2000);
    }

    stopHeightMonitoring() {
        if (this.controller.heightMonitoringInterval) {
            clearInterval(this.controller.heightMonitoringInterval);
            this.controller.heightMonitoringInterval = null;
            this.controller.log('高さ監視を停止しました');
        }
    }

    updateMonitoringInterval(newInterval) {
        this.controller.log(`🔄 監視間隔を${newInterval}msに変更`, 'info');
        if (this.controller.heightMonitoringInterval) {
            clearInterval(this.controller.heightMonitoringInterval);
            this.controller.heightMonitoringInterval = setInterval(() => {
                if (this.controller.isConnected) {
                    this.serial.sendCommand(this.controller.commands.WAKE_UP);
                    this.controller.log('🔄 高さデータ要求を送信中...', 'info');
                }
            }, newInterval);
        }
    }

    updateHeightDisplay(height) {
        this.controller.currentHeight = height;
        document.getElementById('current-height').textContent = `${height} cm`;
    }

    async setPreset(presetNumber) {
        const command = this.controller.commands[`PRESET_${presetNumber}`];
        if (command) {
            await this.serial.sendCommand(command);
            this.controller.log(`プリセット${presetNumber}を実行しました`, 'success');
        }
    }

    startMoveUp() {
        if (this.controller.upInterval) return;

        document.getElementById('up-btn').classList.add('pressing');
        this.serial.sendCommand(this.controller.commands.UP);
        this.controller.upInterval = setInterval(() => {
            this.serial.sendCommand(this.controller.commands.UP);
        }, 400);
        this.controller.log('デスクを上昇中...', 'success');
    }

    stopMoveUp() {
        if (this.controller.upInterval) {
            clearInterval(this.controller.upInterval);
            this.controller.upInterval = null;
            document.getElementById('up-btn').classList.remove('pressing');
            this.controller.log('上昇を停止しました');
        }
    }

    startMoveDown() {
        if (this.controller.downInterval) return;

        document.getElementById('down-btn').classList.add('pressing');
        this.serial.sendCommand(this.controller.commands.DOWN);
        this.controller.downInterval = setInterval(() => {
            this.serial.sendCommand(this.controller.commands.DOWN);
        }, 400);
        this.controller.log('デスクを下降中...', 'success');
    }

    stopMoveDown() {
        if (this.controller.downInterval) {
            clearInterval(this.controller.downInterval);
            this.controller.downInterval = null;
            document.getElementById('down-btn').classList.remove('pressing');
            this.controller.log('下降を停止しました');
        }
    }
}
