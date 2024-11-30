// Model用于记录程序的数据和运行状态
let Model = { 
    timerBegin: new Date(), // 记录程序启动时间
    numOfLearning: 10, // 每次学习的单词数量
    learning: [], // 当前学习的单词列表
    learned: [] // 已学单词列表
};

Model.CET6 = []; // 存放所有CET6单词的数组

{
    // 局部代码，用于处理单词数据，处理完成的单词对象数据放在Model.CET6数组中

    // createCET6函数用于创建单词对象并添加到Model.CET6数组中
    // 入口参数s是单词组成的字符串
    let createCET6 = function(s) {
        let cetArr = s.split('\r\n'); // 将字符串按行分割成数组
        for (let i = 0; i < cetArr.length; i++) {
            let wordArr = cetArr[i].split('\t'); // 将每行按制表符分割成单词数组
            let obj = {};
            obj.en = wordArr[0]; // 英文单词
            obj.pn = wordArr[1]; // 发音
            obj.cn = wordArr[2]; // 中文翻译
            let enlength = obj.en.length; // 英文单词长度

            // 根据单词长度设置难度等级
            if (enlength > 1 && enlength < 5) {
                obj.level = 1;
            } else {
                if (enlength < 8) {
                    obj.level = 2;
                } else {
                    obj.level = 3;
                }
            }
            Model.CET6.push(obj); // 将单词对象添加到CET6数组中
        }
    }; // createCET6结束

    // 为了让慢速网络环境能够迅速响应用户的操作，我们先在代码中存放3个单词
    let cet6String = "a\t/ei/\tart.一(个);每一(个);(同类事物中)任一个\r\n" +
                     "abandon\t/ə'bændən/\tvt.离弃,丢弃;遗弃,抛弃;放弃\r\n" +
                     "abdomen\t/æb'dəumen/\tn.腹,下腹(胸部到腿部的部分)";
    createCET6(cet6String); // 创建初始单词

    // 远程异步读取三个大型单词文本
    const promises = [
        fetch('cet/cet1.txt').then(resp => resp.text()),
        fetch('cet/cet2.txt').then(resp => resp.text()),
        fetch('cet/cet3.txt').then(resp => resp.text())
    ];

    Promise.all(promises).then(texts => {
        texts.forEach(txt => {
            createCET6(txt); // 创建单词对象并添加到CET6数组中
        });
        console.log('单词库加载完成！,总单词数:', Model.CET6.length );
        UI.log('系统成功读取了' + Model.CET6.length + '个单词！');
        localStorage.setItem('CET6Words', JSON.stringify(Model.CET6)); // 保存单词库到本地存储
        enableLoginButton(); // 启用登录按钮
    }).catch(error => {
        console.error('加载单词库时出错:', error);
    });
} // 局部代码结束

function enableLoginButton() {
    if (Model.CET6.length >= 5000) {
        select('button#loginIn').disabled = false;
        console.log('登陆按钮已经启用');
    }else{
        console.log('登陆按钮已经禁用');
    }
}

Model.pos = 0; // pos用于记录系统的当前单词位置
Model.users = []; // 存放用户信息的数组

{
    // 预读本地硬盘的用户信息
    // 假设本地localStorage对象的users属性存放用户信息
    let str = localStorage.getItem('users'); // 从本地存储获取用户信息
    if (str) {
        let users = JSON.parse(str); // 解析用户信息
        Model.users = users; // 更新用户信息
    }
}

let UI = {}; // UI用于表达用户界面，以及改变用户界面上的内容

// printWord函数用于把当前单词（Model.pos存储的索引）显示出来
UI.printWord = function() {
    let CET6 = Model.learning; // 获取当前学习的单词列表
    let pos = Model.pos; // 获取当前单词的位置

    select('p#en').textContent = CET6[pos].en; // 显示英文单词
    select('p#pn').textContent = CET6[pos].pn; // 显示发音
    select('span#level').textContent = '难度: ' + CET6[pos].level; // 显示难度等级

    // 产生一个数组，包含5个单词的中文，其中一个是单词本身
    let cnArr = [];
    let ok = false; // 默认时，正确中文答案没有放置
    for (let i = 0; i < 5; i++) {
        let lv = Math.random() * (5 - i);
        if (lv < 1 && !ok) {
            ok = true;
            cnArr.push(CET6[pos].cn); // 放置正确中文答案
        } else {
            let rand = Math.floor(Math.random() * Model.CET6.length);
            cnArr.push(Model.CET6[rand].cn); // 放置随机中文答案
        }
    } // 循环5次，产生中文随机数组
    if (!ok) {
        ok = true;
        cnArr[4] = CET6[pos].cn; // 确保正确中文答案在数组中
    }

    for (let i = 1; i < 6; i++) {
        select('p#cn' + i).textContent = cnArr[i - 1]; // 显示中文选项
        select('p#cn' + i).className = 'cn'; // 清除用户在点击选择时产生的对、错样式
    }

    let s = "";
    if (CET6[pos].timer && CET6[pos].timer instanceof Date && !isNaN(CET6[pos].timer)) {
        let d = CET6[pos].timer;
        s = '哟，您在' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + (d.getDate()) + '日' + ' 学过';
    } else {
        // 生成一个随机的日期
        let randomYear = 2000 + Math.floor(Math.random() * 23); // 2000到2022年之间
        let randomMonth = Math.floor(Math.random() * 12); // 0到11之间
        let randomDay = Math.floor(Math.random() * 28) + 1; // 1到28之间
        let d = new Date(randomYear, randomMonth, randomDay);
        s = '哟，您在' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + (d.getDate()) + '日' + ' 学过';
    }
    UI.log(s + '@' + (pos + 1) + '/' + Model.numOfLearning + '.'); // 显示当前单词的提示信息
};

// log函数用于在日志区域显示信息
UI.log = function(s) {
    select('p#log').textContent = s;
};

// footerLog函数用于在页脚区域显示信息，并在3秒后恢复默认内容
UI.footerLog = function(s) {
    select('footer').textContent = s;
    setTimeout(() => {
        select('footer').textContent = "江西科技师范大学计算机科学与技术一班李应松2024--2025";
    }, 3 * 1000);
};

// response函数用于在响应区域显示信息
UI.response = function(s) {
    select('span#response').textContent = s;
};

// userStatus函数用于显示用户的单词学习状态
UI.userStatus = function() {
    let easy = 0, normal = 0, hard = 0; // 分别统计熟悉、一般、陌生的单词数量
    for (let word of Model.learned) {
        if (word.level == 0) {
            easy++;
        } else if (word.level < 3) {
            normal++;
        } else {
            hard++;
        }
    }
    let s = Model.user + '状态: ' + easy + '熟悉/' + normal + '一般/' + hard + '陌生';
    select('p#title').textContent = s; // 显示用户状态
    setTimeout(() => {
        select('p#title').textContent = 'CET6-轻轻松松背单词';
    }, 10 * 1000); // 10秒后恢复默认标题
};