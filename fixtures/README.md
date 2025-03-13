# Fixtures

## Setup

<https://tenhou.net/sc/raw/> より年単位でログをダウンロード。`*.log.gz` と
`*.html.gz` の2種類の拡張子が存在する。`*.html.gz`
を利用する。何がとは言わないが、数時間レベルは覚悟しておいたほうが良い。

※ sca=個室 / scb=段位戦 / scc=鳳凰卓(牌譜あり) / scd=雀荘戦 /
sce=技能戦+琥珀卓(牌譜あり) とのこと。scc の牌譜のみを採用する。

```bash
cd ./fixtures/
unzip ~/Downloads/scraw2023.zip

cd ./2023
rm *.log.gz
gunzip *.html.gz

for i in `ls scc*.html`; do
    echo $i
    while read head; do
        URL=`echo $head | grep -oE 'http[^"]*' | sed -e 's/?log=/log\/?/g'`
        ID=`echo $URL | gsed -e 's$http://tenhou.net/0/log/?$$'`
        curl -s $URL > $ID.xml
    done < $i
    rm $i
done
```