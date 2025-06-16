// FlexiSpot Serial Communication Module
class SerialCommunication {
    constructor(controller) {
        this.controller = controller;
    }

    async startReading() {
        try {
            while (this.controller.port.readable) {
                const { value, done } = await this.controller.reader.read();
                if (done) break;

                this.processReceivedData(value);
            }
        } catch (error) {
            this.controller.log(`データ受信エラー: ${error.message}`, 'error');
        }
    }

    processReceivedData(data) {
        if (!this.controller.dataBuffer) {
            this.controller.dataBuffer = [];
        }
        this.controller.dataBuffer.push(...Array.from(data));

        this.controller.log(`📨 受信データ: ${Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')} (長さ: ${data.length})`, 'info');
        this.controller.log(`📊 バッファ合計: ${this.controller.dataBuffer.length} bytes`, 'info');
        
        this.parseMessages();
    }

    parseMessages() {
        while (this.controller.dataBuffer.length >= 6) {
            let startIdx = -1;
            for (let i = 0; i < this.controller.dataBuffer.length; i++) {
                if (this.controller.dataBuffer[i] === 0x9b) {
                    startIdx = i;
                    break;
                }
            }

            if (startIdx === -1) {
                this.controller.dataBuffer = [];
                break;
            }

            if (startIdx > 0) {
                const removed = this.controller.dataBuffer.slice(0, startIdx);
                if (removed.length >= 8 && removed[0] === 0x07 && removed[1] === 0x12) {
                    const height = this.parseHeightAlt(removed);
                    if (height !== null) {
                        this.controller.updateHeightDisplay(height);
                        this.controller.log(`高さ更新: ${height} cm`, 'success');
                    }
                }
                this.controller.dataBuffer = this.controller.dataBuffer.slice(startIdx);
            }

            if (this.controller.dataBuffer.length < 2) {
                break;
            }

            const msgLen = this.controller.dataBuffer[1];
            const totalLen = msgLen + 3;

            if (this.controller.dataBuffer.length < totalLen) {
                break;
            }

            const message = this.controller.dataBuffer.slice(0, totalLen);
            this.controller.dataBuffer = this.controller.dataBuffer.slice(totalLen);

            this.analyzeMessage(message);
        }
    }

    analyzeMessage(message) {
        this.controller.log(`🔍 解析中メッセージ: ${message.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`, 'info');

        if (message.length >= 9 && message[1] === 0x07 && message[2] === 0x12) {
            this.controller.log(`📏 高さメッセージ検出`, 'info');
            const height = this.parseHeight(message);
            if (height !== null) {
                this.controller.updateHeightDisplay(height);
                this.controller.log(`✅ 高さ更新: ${height} cm`, 'success');
            } else {
                this.controller.log(`❌ 高さパース失敗`, 'warn');
            }
        } else if (message.length >= 7 && message[1] === 0x04 && message[2] === 0x11) {
            this.controller.log(`🔍 タイプ0x11メッセージ検出`, 'info');
            this.parseMessage0x11(message);
        } else {
            this.controller.log(`ℹ️ 他のメッセージタイプ: length=${message[1]}, type=${message[2] ? '0x' + message[2].toString(16) : 'N/A'}`, 'info');
            if (message.length > 3) {
                const dataBytes = message.slice(3, -1);
                this.controller.log(`📋 メッセージデータ: ${dataBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`, 'info');
            }
        }
    }

    parseHeight(message) {
        if (message.length < 9) {
            this.controller.log(`❌ メッセージが短すぎます: ${message.length} < 9`, 'warn');
            return null;
        }

        const heightBytes = message.slice(3, 7);
        this.controller.log(`📊 高さバイト: ${heightBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`, 'info');

        const digits = [];
        let decimalPosition = -1;

        for (let i = 0; i < heightBytes.length; i++) {
            const decoded = this.decodeSevenSegment(heightBytes[i]);
            this.controller.log(`🔢 位置${i}: 0x${heightBytes[i].toString(16).padStart(2, '0')} -> 数字:${decoded.digit}, 小数点:${decoded.hasDecimal}`, 'info');

            if (decoded.digit !== null && decoded.digit !== -1) {
                digits.push(decoded.digit);
                if (decoded.hasDecimal) {
                    decimalPosition = digits.length - 1;
                }
            }
        }

        if (digits.length === 0) {
            this.controller.log(`❌ 有効な数字が見つかりません`, 'warn');
            return null;
        }

        let heightStr = digits.join('');
        if (decimalPosition >= 0 && decimalPosition < heightStr.length - 1) {
            heightStr = heightStr.substring(0, decimalPosition + 1) + '.' + heightStr.substring(decimalPosition + 1);
        }

        const height = parseFloat(heightStr);
        this.controller.log(`🎯 解析結果: ${heightStr} -> ${height}`, height ? 'success' : 'warn');
        return isNaN(height) ? null : height;
    }

    parseHeightAlt(message) {
        if (message.length < 8 || message[0] !== 0x07 || message[1] !== 0x12) {
            return null;
        }

        const digit1Byte = message[2];
        const digit2Byte = message[3];
        const digit3Byte = message[4];

        const { digit: digit1, hasDecimal: decimal1 } = this.decodeSevenSegment(digit1Byte);
        const { digit: digit2, hasDecimal: decimal2 } = this.decodeSevenSegment(digit2Byte);
        const { digit: digit3, hasDecimal: decimal3 } = this.decodeSevenSegment(digit3Byte);

        if ([digit1, digit2, digit3].every(d => d >= 0 && d <= 9)) {
            let height = digit1 * 100 + digit2 * 10 + digit3;
            if (decimal1 || decimal2 || decimal3) {
                height = height / 10;
            }
            return height;
        }

        return null;
    }

    parseMessage0x11(message) {
        if (message.length < 7) return;

        const data = message.slice(3, -1);
        this.controller.log(`🔍 0x11メッセージデータ: ${data.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`, 'info');

        if (data.length === 2) {
            const value1 = data[0];
            const value2 = data[1];
            this.controller.log(`📊 0x11データ解析: value1=0x${value1.toString(16)}, value2=0x${value2.toString(16)}`, 'info');
            this.controller.log(`ℹ️ デスク状態: ${value1}, ${value2}`, 'info');
        }
    }

    decodeSevenSegment(byteVal) {
        if (byteVal === 0x00) {
            return { digit: -1, hasDecimal: false };
        }

        const binary = byteVal.toString(2).padStart(8, '0');
        const hasDecimal = binary[0] === '1';
        const segments = binary.substring(1);

        const patterns = {
            '0111111': 0, '0000110': 1, '1011011': 2, '1001111': 3,
            '1100110': 4, '1101101': 5, '1111101': 6, '0000111': 7,
            '1111111': 8, '1101111': 9
        };

        const digit = patterns[segments] ?? -1;
        return { digit, hasDecimal };
    }

    async sendCommand(command) {
        if (!this.controller.isConnected || !this.controller.writer) {
            this.controller.log('デスクに接続してください', 'error');
            return;
        }

        try {
            await this.controller.writer.write(command);
            this.controller.log(`コマンド送信: ${Array.from(command).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
        } catch (error) {
            this.controller.log(`コマンド送信エラー: ${error.message}`, 'error');
        }
    }
}
