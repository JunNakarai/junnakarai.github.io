// 実際に受信したデータをテスト
const receivedData = [0x9b, 0x07, 0x12, 0x06, 0x3f, 0x66, 0x63, 0xe5, 0x9d];

console.log('受信データ:', receivedData.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
console.log('メッセージ長:', receivedData.length);
console.log('プロトコル分析:');
console.log('  開始バイト (0x9b):', receivedData[0] === 0x9b ? 'OK' : 'NG');
console.log('  メッセージ長 (0x07):', receivedData[1]);
console.log('  メッセージタイプ (0x12):', '0x' + receivedData[2].toString(16));
console.log('  データ部分:', receivedData.slice(3, -1).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
console.log('  チェックサム:', '0x' + receivedData[receivedData.length - 1].toString(16));

// 7セグメントデコード
function decodeSevenSegment(byteVal) {
    if (byteVal === 0x00) {
        return { digit: -1, hasDecimal: false };
    }

    const binary = byteVal.toString(2).padStart(8, '0');
    const hasDecimal = binary[0] === '1';
    const segments = binary.substring(1);

    // 7セグメント表示パターン（上位7ビット）
    const patterns = {
        '0111111': 0, // 0
        '0000110': 1, // 1
        '1011011': 2, // 2
        '1001111': 3, // 3
        '1100110': 4, // 4
        '1101101': 5, // 5
        '1111101': 6, // 6
        '0000111': 7, // 7
        '1111111': 8, // 8
        '1101111': 9, // 9
        '0000000': null, // 空/エラー
        '1000000': null, // エラー表示（一般的に上のセグメントのみ点灯）
    };

    return {
        digit: patterns[segments] !== undefined ? patterns[segments] : null,
        hasDecimal: hasDecimal,
        binary: binary,
        segments: segments
    };
}

// 高さデータを解析（データ部分: 0x06 0x3f 0x66 0x63）
const heightData = receivedData.slice(3, 7); // 0x06 0x3f 0x66 0x63
console.log('\n高さデータ解析:');
console.log('高さデータ:', heightData.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

// 各バイトを7セグメントデコード
heightData.forEach((byte, index) => {
    const decoded = decodeSevenSegment(byte);
    console.log(`  位置${index}: 0x${byte.toString(16).padStart(2, '0')} -> 数字:${decoded.digit}, 小数点:${decoded.hasDecimal}, バイナリ:${decoded.binary}`);
});

// 高さを計算してみる
function parseHeight(heightData) {
    const digits = [];
    let decimalPosition = -1;

    for (let i = 0; i < heightData.length; i++) {
        const decoded = decodeSevenSegment(heightData[i]);
        if (decoded.digit !== null && decoded.digit !== -1) {
            digits.push(decoded.digit);
            if (decoded.hasDecimal) {
                decimalPosition = digits.length - 1;
            }
        }
    }

    if (digits.length === 0) {
        return null;
    }

    // 数字を結合
    let heightStr = digits.join('');
    
    // 小数点を挿入
    if (decimalPosition >= 0 && decimalPosition < heightStr.length - 1) {
        heightStr = heightStr.substring(0, decimalPosition + 1) + '.' + heightStr.substring(decimalPosition + 1);
    }

    const height = parseFloat(heightStr);
    return isNaN(height) ? null : height;
}

const height = parseHeight(heightData);
console.log(`\n最終結果: ${height !== null ? height + ' cm' : '解析失敗'}`);
