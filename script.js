async function search() {
    const location = document.getElementById("location").value;
    if (!location) {
        alert("請輸入地點！");
        return;
    }

    // 以下為模擬資料，你可以改成呼叫 TDX API
    document.getElementById("hotels").innerHTML = "🏨 旅宿推薦：<br>1. XX飯店<br>2. YY民宿";
    document.getElementById("spots").innerHTML = "📍 景點推薦：<br>1. 博物館<br>2. 夜市";
    document.getElementById("foods").innerHTML = "🍜 美食推薦：<br>1. 牛肉麵<br>2. 蚵仔煎";

    // 示例：取得附近公車站牌（需替換 access token）
    const token = "YOUR_TDX_ACCESS_TOKEN";
    const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/Taipei?%24top=5&%24format=JSON`;

    const response = await fetch(url, {
        headers: {
            "authorization": "Bearer " + token
        }
    });

    if (response.ok) {
        const data = await response.json();
        const names = data.map(stop => stop.StopName.Zh_tw).join("<br>");
        document.getElementById("transport").innerHTML = "🚌 附近站牌：<br>" + names;
    } else {
        document.getElementById("transport").innerHTML = "🚧 無法取得交通資訊";
    }
}

