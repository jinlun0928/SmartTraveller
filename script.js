// TDX API 設定
const TDX_API_URL = "https://tdx.transportdata.tw/api/basic/v2";
const TDX_APP_ID = "sssun-09d597db-5ec8-446e";
const TDX_APP_KEY = "8ffe4bd6-dc2e-40e1-8f9e-2c5d62e13ab1";

// 城市與 API 端點對應
const CITY_API_ENDPOINTS = {
    "台北市": "/Tourism/ScenicSpot/Taipei",
    "新北市": "/Tourism/ScenicSpot/NewTaipei",
    "桃園市": "/Tourism/ScenicSpot/Taoyuan",
    "台中市": "/Tourism/ScenicSpot/Taichung",
    "台南市": "/Tourism/ScenicSpot/Tainan",
    "高雄市": "/Tourism/ScenicSpot/Kaohsiung",
    "基隆市": "/Tourism/ScenicSpot/Keelung",
    "新竹市": "/Tourism/ScenicSpot/Hsinchu",
    "嘉義市": "/Tourism/ScenicSpot/Chiayi",
    "宜蘭縣": "/Tourism/ScenicSpot/YilanCounty",
    "花蓮縣": "/Tourism/ScenicSpot/HualienCounty",
    "台東縣": "/Tourism/ScenicSpot/TaitungCounty",
    "澎湖縣": "/Tourism/ScenicSpot/PenghuCounty",
    "金門縣": "/Tourism/ScenicSpot/KinmenCounty",
    "連江縣": "/Tourism/ScenicSpot/LienchiangCounty"
};

// 城市與美食 API 端點對應
const CITY_FOOD_ENDPOINTS = {
    "台北市": "/Tourism/Restaurant/Taipei",
    "新北市": "/Tourism/Restaurant/NewTaipei",
    "桃園市": "/Tourism/Restaurant/Taoyuan",
    "台中市": "/Tourism/Restaurant/Taichung",
    "台南市": "/Tourism/Restaurant/Tainan",
    "高雄市": "/Tourism/Restaurant/Kaohsiung",
    "基隆市": "/Tourism/Restaurant/Keelung",
    "新竹市": "/Tourism/Restaurant/Hsinchu",
    "嘉義市": "/Tourism/Restaurant/Chiayi",
    "宜蘭縣": "/Tourism/Restaurant/YilanCounty",
    "花蓮縣": "/Tourism/Restaurant/HualienCounty",
    "台東縣": "/Tourism/Restaurant/TaitungCounty",
    "澎湖縣": "/Tourism/Restaurant/PenghuCounty",
    "金門縣": "/Tourism/Restaurant/KinmenCounty",
    "連江縣": "/Tourism/Restaurant/LienchiangCounty"
};

// 城市列表
const cities = [
    "台北市",
    "新北市",
    "桃園市",
    "台中市",
    "台南市",
    "高雄市",
    "基隆市",
    "新竹市",
    "嘉義市",
    "宜蘭縣",
    "花蓮縣",
    "台東縣",
    "澎湖縣",
    "金門縣",
    "連江縣"
];

// 全域變數
let allSpots = []; // 儲存所有景點資料
let allFoods = []; // 儲存所有美食資料

// 初始化下拉選單
function initializeDropdown() {
    const citySelect = document.getElementById('location');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            const selectedCity = this.value;
            if (selectedCity) {
                console.log('選擇的城市:', selectedCity);
            }
        });
    }
}

// 獲取 TDX API 的存取令牌
async function getTdxToken() {
    const url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const data = new URLSearchParams({
        "grant_type": "client_credentials",
        "client_id": TDX_APP_ID,
        "client_secret": TDX_APP_KEY
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data
        });
        
        if (!response.ok) {
            throw new Error('無法獲取 API 認證');
        }
        
        const tokenData = await response.json();
        return tokenData.access_token;
    } catch (error) {
        console.error('獲取 token 時發生錯誤:', error);
        throw error;
    }
}

// 修改 searchSpots 函數
async function searchSpots() {
    const city = document.getElementById('location').value;
    const spotsContainer = document.getElementById('spotsContainer');
    spotsContainer.innerHTML = '<div class="loading">搜尋中...</div>';

    try {
        // 隱藏美食相關區域
        hideFoodSections();

        const token = await getTdxToken();
        const endpoint = CITY_API_ENDPOINTS[city];
        
        if (!endpoint) {
            throw new Error('不支援的城市');
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };

        const params = new URLSearchParams({
            "$select": "ScenicSpotID,ScenicSpotName,Address,Phone,Description,OpenTime,Class1,Class2,Class3,Picture,UpdateTime",
            "$top": "100"
        });

        const response = await fetch(`${TDX_API_URL}${endpoint}?${params}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('無法獲取景點資料');
        }

        const spots = await response.json();
        allSpots = spots; // 保存所有景點資料
        displaySpots(spots);
        setupCategoryFilter(spots); // 設置類別篩選
    } catch (error) {
        spotsContainer.innerHTML = `<div class="error">錯誤: ${error.message}</div>`;
    }
}

// 修改 searchFoods 函數
async function searchFoods() {
    const city = document.getElementById('location').value;
    const foodsContainer = document.getElementById('foodsContainer');
    foodsContainer.innerHTML = '<div class="loading">搜尋中...</div>';

    try {
        // 隱藏景點相關區域
        hideSpotSections();

        const token = await getTdxToken();
        const endpoint = CITY_FOOD_ENDPOINTS[city];
        
        if (!endpoint) {
            throw new Error('不支援的城市');
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };

        const params = new URLSearchParams({
            "$select": "RestaurantID,RestaurantName,Address,Phone,Description,OpenTime,Picture,UpdateTime",
            "$top": "100"
        });

        // 如果是台北市，添加地址過濾
        if (city === "台北市") {
            params.append("$filter", "contains(Address, '台北市')");
        }

        const response = await fetch(`${TDX_API_URL}${endpoint}?${params}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('無法獲取美食資料');
        }

        const foods = await response.json();
        allFoods = foods; // 保存所有美食資料
        displayFoods(foods);
        setupFoodCategoryFilter(foods); // 設置美食類別篩選
    } catch (error) {
        foodsContainer.innerHTML = `<div class="error">錯誤: ${error.message}</div>`;
    }
}

// 設置類別篩選
function setupCategoryFilter(spots) {
    const filterContainer = document.getElementById('categoryFilterContainer');
    const categorySelect = document.getElementById('categoryFilter');
    
    if (!filterContainer || !categorySelect) return;
    
    // 收集所有類別
    const categories = new Set();
    spots.forEach(spot => {
        if (spot.Class1) categories.add(spot.Class1);
        if (spot.Class2) categories.add(spot.Class2);
        if (spot.Class3) categories.add(spot.Class3);
    });
    
    // 清空並重新填充選項
    categorySelect.innerHTML = '<option value="">全部類別</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // 顯示篩選區域
    filterContainer.style.display = 'block';
}

// 設置美食類別篩選
function setupFoodCategoryFilter(foods) {
    console.log('設置美食類別篩選，美食數量:', foods.length);
    
    const filterContainer = document.getElementById('foodCategoryFilterContainer');
    const categorySelect = document.getElementById('foodCategoryFilter');
    
    console.log('篩選容器:', filterContainer);
    console.log('類別選擇器:', categorySelect);
    
    if (!filterContainer || !categorySelect) {
        console.error('找不到美食篩選容器或選擇器');
        return;
    }

    // 根據餐廳名稱和描述創建關鍵字分類
    const categories = new Set();
    const keywords = {
        '咖啡廳': ['咖啡', 'cafe', 'café', '咖啡廳', '咖啡館'],
        '火鍋': ['火鍋', '麻辣', '涮涮鍋', '鍋物'],
        '日式料理': ['日式', '日本', '壽司', '拉麵', '丼飯', '居酒屋'],
        '中式料理': ['中式', '川菜', '粵菜', '台菜', '客家'],
        '西式料理': ['西式', '義大利', '法國', '美式', '牛排'],
        '甜點': ['甜點', '蛋糕', '冰淇淋', '甜食', '下午茶'],
        '早餐': ['早餐', '早午餐', 'brunch'],
        '宵夜': ['宵夜', '深夜', '24小時'],
        '素食': ['素食', '蔬食', 'vegan', 'vegetarian'],
        '海鮮': ['海鮮', '海產', '魚', '蝦', '蟹']
    };
    
    // 檢查每個餐廳並分類
    foods.forEach(food => {
        const name = food.RestaurantName || '';
        const description = food.Description || '';
        const text = (name + ' ' + description).toLowerCase();
        
        for (const [category, keywordList] of Object.entries(keywords)) {
            if (keywordList.some(keyword => text.includes(keyword.toLowerCase()))) {
                categories.add(category);
                break;
            }
        }
    });
    
    console.log('找到的類別:', Array.from(categories));
    
    // 清空並重新填充選項
    categorySelect.innerHTML = '<option value="">全部類別</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // 顯示篩選區域
    filterContainer.style.display = 'block';
    console.log('美食篩選區域已顯示');
}

// 套用篩選
function applyFilter() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    if (!selectedCategory) {
        // 如果選擇全部類別，顯示所有景點
        displaySpots(allSpots);
        return;
    }

    // 篩選符合類別的景點
    const filteredSpots = allSpots.filter(spot => {
        return spot.Class1 === selectedCategory || 
               spot.Class2 === selectedCategory || 
               spot.Class3 === selectedCategory;
    });
    
    displaySpots(filteredSpots);
}

// 套用美食篩選
function applyFoodFilter() {
    const selectedCategory = document.getElementById('foodCategoryFilter').value;
    
    if (!selectedCategory) {
        // 如果選擇全部類別，顯示所有美食
        displayFoods(allFoods);
        return;
    }
    
    // 關鍵字對應
    const keywords = {
        '咖啡廳': ['咖啡', 'cafe', 'café', '咖啡廳', '咖啡館'],
        '火鍋': ['火鍋', '麻辣', '涮涮鍋', '鍋物'],
        '日式料理': ['日式', '日本', '壽司', '拉麵', '丼飯', '居酒屋'],
        '中式料理': ['中式', '川菜', '粵菜', '台菜', '客家'],
        '西式料理': ['西式', '義大利', '法國', '美式', '牛排'],
        '甜點': ['甜點', '蛋糕', '冰淇淋', '甜食', '下午茶'],
        '早餐': ['早餐', '早午餐', 'brunch'],
        '宵夜': ['宵夜', '深夜', '24小時'],
        '素食': ['素食', '蔬食', 'vegan', 'vegetarian'],
        '海鮮': ['海鮮', '海產', '魚', '蝦', '蟹']
    };
    
    const keywordList = keywords[selectedCategory] || [];
    
    // 篩選符合關鍵字的美食
    const filteredFoods = allFoods.filter(food => {
        const name = food.RestaurantName || '';
        const description = food.Description || '';
        const text = (name + ' ' + description).toLowerCase();
        
        return keywordList.some(keyword => text.includes(keyword.toLowerCase()));
    });
    
    displayFoods(filteredFoods);
}

// 清除篩選
function clearFilter() {
    document.getElementById('categoryFilter').value = '';
    displaySpots(allSpots);
}

// 清除美食篩選
function clearFoodFilter() {
    document.getElementById('foodCategoryFilter').value = '';
    displayFoods(allFoods);
}

function displaySpots(spots) {
    const spotsContainer = document.getElementById('spotsContainer');
    spotsContainer.innerHTML = '';
    
    if (spots.length === 0) {
        spotsContainer.innerHTML = '<p>找不到景點資料</p>';
        return;
    }

    spots.forEach((spot, index) => {
        const spotCard = document.createElement('div');
        spotCard.className = 'spot-card';
        
        // 處理不同城市的地址欄位
        let address = spot.Address || spot.ScenicSpotAddress || spot.Location || spot.AddressDetail || '無地址資料';
        
        // 添加圖片
        let imageHtml = '';
        if (spot.Picture && spot.Picture.PictureUrl1) {
            imageHtml = `
                <div class="spot-image">
                    <img src="${spot.Picture.PictureUrl1}" alt="${spot.ScenicSpotName}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                </div>
            `;
        } else {
            imageHtml = `
                <div class="spot-image">
                    <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No image available">
                </div>
            `;
        }

        // 構建簡化資訊（卡片顯示）
        let detailsHtml = `
            <h3>${spot.ScenicSpotName}</h3>
            <p><strong>地址：</strong>${address}</p>
            <p><strong>電話：</strong>${spot.Phone || '無資料'}</p>
        `;

        // 添加描述（限制顯示）
        if (spot.Description) {
            detailsHtml += `<p class="description"><strong>描述：</strong>${spot.Description}</p>`;
        }

        spotCard.innerHTML = `
            ${imageHtml}
            <div class="spot-info">
                ${detailsHtml}
            </div>
        `;
        
        // 添加點擊事件
        spotCard.addEventListener('click', () => {
            showSpotDetail(spot);
        });
        
        spotsContainer.appendChild(spotCard);
    });
}

function displayFoods(foods) {
    const foodsContainer = document.getElementById('foodsContainer');
    foodsContainer.innerHTML = '';
    
    if (foods.length === 0) {
        foodsContainer.innerHTML = '<p>找不到美食資料</p>';
        return;
    }

    foods.forEach((food, index) => {
        const foodCard = document.createElement('div');
        foodCard.className = 'food-card';
        
        // 處理不同城市的地址欄位
        let address = food.Address || food.RestaurantAddress || food.Location || food.AddressDetail || '無地址資料';
        
        // 添加圖片
        let imageHtml = '';
        if (food.Picture && food.Picture.PictureUrl1) {
            imageHtml = `
                <div class="food-image">
                    <img src="${food.Picture.PictureUrl1}" alt="${food.RestaurantName}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                </div>
            `;
        } else {
            imageHtml = `
                <div class="food-image">
                    <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No image available">
                </div>
            `;
        }

        // 構建簡化資訊（卡片顯示）
        let detailsHtml = `
            <h3>${food.RestaurantName}</h3>
            <p><strong>地址：</strong>${address}</p>
            <p><strong>電話：</strong>${food.Phone || '無資料'}</p>
        `;

        // 添加描述（限制顯示）
        if (food.Description) {
            detailsHtml += `<p class="description"><strong>描述：</strong>${food.Description}</p>`;
        }

        foodCard.innerHTML = `
            ${imageHtml}
            <div class="food-info">
                ${detailsHtml}
            </div>
        `;
        
        // 添加點擊事件
        foodCard.addEventListener('click', () => {
            showFoodDetail(food);
        });
        
        foodsContainer.appendChild(foodCard);
    });
}

// 顯示景點詳細資訊
function showSpotDetail(spot) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // 處理不同城市的地址欄位
    let address = spot.Address || spot.ScenicSpotAddress || spot.Location || spot.AddressDetail || '無地址資料';
    
    // 構建詳細資訊
    let detailHtml = `
        <h2>${spot.ScenicSpotName}</h2>
        <p><strong>景點ID：</strong>${spot.ScenicSpotID || '無資料'}</p>
        <p><strong>地址：</strong>${address}</p>
        <p><strong>電話：</strong>${spot.Phone || '無資料'}</p>
        <p><strong>開放時間：</strong>${spot.OpenTime || '無資料'}</p>
    `;

    // 添加分類資訊
    if (spot.Class1 || spot.Class2 || spot.Class3) {
        detailHtml += `<p><strong>分類：</strong>${spot.Class1 || ''} ${spot.Class2 || ''} ${spot.Class3 || ''}</p>`;
    }

    // 添加時間資訊
    if (spot.UpdateTime) detailHtml += `<p><strong>更新時間：</strong>${spot.UpdateTime}</p>`;

    // 添加描述
    if (spot.Description) {
        detailHtml += `<p><strong>描述：</strong>${spot.Description}</p>`;
    }

    // 添加圖片
    if (spot.Picture && spot.Picture.PictureUrl1) {
        detailHtml = `
            <img src="${spot.Picture.PictureUrl1}" alt="${spot.ScenicSpotName}" class="modal-image" 
                 onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    } else {
        detailHtml = `
            <img src="https://via.placeholder.com/600x300?text=No+Image" alt="No image available" class="modal-image">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    }
    
    modalContent.innerHTML = detailHtml;
    modal.style.display = 'block';
}

// 顯示美食詳細資訊
function showFoodDetail(food) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // 處理不同城市的地址欄位
    let address = food.Address || food.RestaurantAddress || food.Location || food.AddressDetail || '無地址資料';
    
    // 構建詳細資訊
    let detailHtml = `
        <h2>${food.RestaurantName}</h2>
        <p><strong>餐廳ID：</strong>${food.RestaurantID || '無資料'}</p>
        <p><strong>地址：</strong>${address}</p>
        <p><strong>電話：</strong>${food.Phone || '無資料'}</p>
        <p><strong>營業時間：</strong>${food.OpenTime || '無資料'}</p>
    `;

    // 添加時間資訊
    if (food.UpdateTime) detailHtml += `<p><strong>更新時間：</strong>${food.UpdateTime}</p>`;

    // 添加描述
    if (food.Description) {
        detailHtml += `<p><strong>描述：</strong>${food.Description}</p>`;
    }

    // 添加圖片
    if (food.Picture && food.Picture.PictureUrl1) {
        detailHtml = `
            <img src="${food.Picture.PictureUrl1}" alt="${food.RestaurantName}" class="modal-image" 
                 onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    } else {
        detailHtml = `
            <img src="https://via.placeholder.com/600x300?text=No+Image" alt="No image available" class="modal-image">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    }
    
    modalContent.innerHTML = detailHtml;
    modal.style.display = 'block';
}

// 隱藏景點相關區域
function hideSpotSections() {
    const spotsContainer = document.getElementById('spotsContainer');
    const categoryFilterContainer = document.getElementById('categoryFilterContainer');
    
    if (spotsContainer) {
        spotsContainer.innerHTML = '';
    }
    if (categoryFilterContainer) {
        categoryFilterContainer.style.display = 'none';
    }
}

// 隱藏美食相關區域
function hideFoodSections() {
    const foodsContainer = document.getElementById('foodsContainer');
    const foodCategoryFilterContainer = document.getElementById('foodCategoryFilterContainer');
    
    if (foodsContainer) {
        foodsContainer.innerHTML = '';
    }
    if (foodCategoryFilterContainer) {
        foodCategoryFilterContainer.style.display = 'none';
    }
}

// 初始化事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化下拉選單
    initializeDropdown();

    // 設置景點推薦點擊事件
    const spotsSection = document.getElementById("spots");
    if (spotsSection) {
        spotsSection.style.cursor = 'pointer';
        spotsSection.addEventListener('click', async () => {
            const location = document.getElementById("location").value;
            if (!location) {
                alert("請先選擇城市");
                return;
            }

            try {
                const token = await getTdxToken();
                await searchSpots(location, token);
            } catch (error) {
                console.error("Error fetching attractions:", error);
                alert("無法取得景點資訊，請稍後再試");
            }
        });
    }

    // 為美食推薦區域添加點擊事件
    const foodsSection = document.getElementById('foods');
    if (foodsSection) {
        foodsSection.style.cursor = 'pointer';
        foodsSection.addEventListener('click', async function() {
            const location = document.getElementById('location').value;
            if (!location) {
                alert('請先選擇城市');
                return;
            }
            try {
                await searchFoods();
            } catch (error) {
                console.error("Error fetching foods:", error);
                alert("無法取得美食資訊，請稍後再試");
            }
        });
    }

    // 設置彈窗關閉事件
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // 點擊彈窗外部關閉
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // ESC 鍵關閉彈窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
});
