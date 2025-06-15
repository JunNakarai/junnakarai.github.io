// FlexiSpot高さデータ解析テスト

// 受信データ: 0x07 0x12 0x06 0x3f 0x66 0x63 0xe5
const heightData = [0x07, 0x12, 0x06, 0x3f, 0x66, 0x63, 0xe5];

// 7セグメントディスプレイ値のデコード
function decodeSevenSegment(byteVal) {
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

console.log("=== FlexiSpot高さデータ解析 ===");
console.log("受信データ:", heightData.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
console.log("配列長さ:", heightData.length);
console.log("最初のバイト:", heightData[0], "= 0x" + heightData[0].toString(16));
console.log("2番目のバイト:", heightData[1], "= 0x" + heightData[1].toString(16));

// フォーマットチェック
console.log("フォーマットチェック:");
console.log("- 長さ >= 8:", heightData.length >= 8);
console.log("- 1番目が0x07:", heightData[0] === 0x07);  
console.log("- 2番目が0x12:", heightData[1] === 0x12);
if (heightData.length >= 7 && heightData[0] === 0x07 && heightData[1] === 0x12) {
    console.log("✅ 高さデータフォーマット検出: 0x07 0x12");

    // 高さの数字は位置2, 3, 4にある
    const digit1Byte = heightData[2];
    const digit2Byte = heightData[3];  
    const digit3Byte = heightData[4];

    console.log(`数字バイト: 0x${digit1Byte.toString(16)} 0x${digit2Byte.toString(16)} 0x${digit3Byte.toString(16)}`);
    console.log(`バイナリ: ${digit1Byte.toString(2).padStart(8, '0')} ${digit2Byte.toString(2).padStart(8, '0')} ${digit3Byte.toString(2).padStart(8, '0')}`);

    // 各バイトをデコード
    const result1 = decodeSevenSegment(digit1Byte);
    const result2 = decodeSevenSegment(digit2Byte);
    const result3 = decodeSevenSegment(digit3Byte);
    
    console.log(`デコード結果:`, result1, result2, result3);
    
    // 全ての数字が有効かチェック
    if ([result1.digit, result2.digit, result3.digit].every(d => d >= 0 && d <= 9)) {
        let height = result1.digit * 100 + result2.digit * 10 + result3.digit;

        // 小数点があれば適用
        if (result1.hasDecimal || result2.hasDecimal || result3.hasDecimal) {
            height = height / 10;
        }

        console.log(`✅ 計算された高さ: ${height} cm`);
    } else {
        console.log("❌ 無効な数字が検出されました");
        
        // 7セグメントパターンを詳細表示
        console.log("=== 7セグメント詳細解析 ===");
        [digit1Byte, digit2Byte, digit3Byte].forEach((byte, index) => {
            const binary = byte.toString(2).padStart(8, '0');
            const segments = binary.substring(1);
            console.log(`桁${index + 1}: 0x${byte.toString(16)} = ${binary} (セグメント: ${segments})`);
        });
    }
} else {
    console.log("❌ フォーマットエラー: 0x07 0x12 で始まっていません");
}
