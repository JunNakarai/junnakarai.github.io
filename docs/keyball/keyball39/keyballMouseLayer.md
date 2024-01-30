# Keyballのマウスレイヤー改造

## はじめに

Keyball39の自動マウスレイヤー滞在時に、右クリックと左クリックに加え、以下の操作ができるようにカスタマイズしました。

- 十字キー操作
- 切り取り、コピー&ペースト操作
- 進む、戻る操作

ファームウェアはこちらです。[リリースページ](https://github.com/JunNakarai/keyball/releases/tag/1.0.0)

新機能の各コマンドは以下のキーコードに対応しています

|  CODE  |     COMMAND     |
| ------ | --------------- |
| 0x5DBB | MouseBtn1       |
| 0x5DBD | MouseBtn2       |
| 0x5DBF | MouseBtn3       |
| 0x5DC1 | CMD + X         |
| 0x5DC1 | CMD + C         |
| 0x5DC1 | CMD + V         |
| 0x5DC1 | CMD + Z         |
| 0x5DC1 | CMD + SHIFT + Z |

## 参考記事

この改造にあたり、以下の記事を参考にしました

- [参考記事](https://zenn.dev/takashicompany/articles/69b87160cda4b9)
