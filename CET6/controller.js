// 初始化表单元素
UI.form = select('form');

/**
 * 异步代码开始，用于用户UI的交互控制（按钮点击事件）
 */

// 登录按钮点击事件处理函数
select('button#loginIn').onclick = function(ev) {
    ev.preventDefault(); // 阻止表单默认提交行为
    let users = Model.users; // 获取用户列表
    let userName = UI.form.user.value; // 获取用户名
    let passWord = UI.form.pass.value; // 获取密码

    let success = false; // 标记登录是否成功
    for (let u of users) {
        if (u.userName === userName && u.passWord === passWord) {
            success = true; // 用户名和密码匹配，登录成功
            break;
        }
    }

    // 处理登录逻辑
    if (success && Model.CET6.length >= 5000) {
        UI.log(userName + '成功登录！'); // 登录成功
        Model.user = userName; // 设置当前登录用户
        UI.form.style.display = 'none'; // 隐藏登录表单

        // 预读用户的学习状态
        let learned = localStorage.getItem(Model.user + '-learned'); // 从本地存储获取用户已学单词
        if (learned) {
            Model.learned = JSON.parse(learned); // 解析已学单词
            console.log('从本地存储读取的已学单词数量:', Model.learned.length); // 输出已学单词数量
        } else {
            Model.learned = []; // 如果没有已学单词，初始化为空数组
        }

        // 生成新的学习单词列表
        generateNewWords();

        UI.printWord(); // 显示当前单词
        UI.userStatus(); // 更新用户状态
    } else { // 不允许登录的情况
        if (!success) {
            UI.footerLog(userName + '登录不成功，请查看用户名和密码！'); // 用户名或密码错误
        }
        if (Model.CET6.length < 5000) {
            UI.footerLog('单词库还未加载完毕，请等会儿再登录！'); // 单词库未加载完成
        }
    }
};

// 注册按钮点击事件处理函数
select('button#signIn').onclick = function(ev) {
    ev.preventDefault(); // 阻止表单默认提交行为
    let users = Model.users; // 获取用户列表
    let userName = UI.form.user.value; // 获取用户名
    let passWord = UI.form.pass.value; // 获取密码

    let exists = false; // 标记用户是否存在
    for (let u of users) {
        if (u.userName === userName) {
            exists = true; // 用户名已存在
            break;
        }
    }

    // 处理注册逻辑
    if (exists) {
        UI.footerLog(userName + '用户已存在，请重新输入用户名！'); // 用户名已存在
    } else {
        let newUser = {
            userName: userName,
            passWord: passWord
        };
        Model.users.push(newUser); // 添加新用户
        localStorage.setItem('users', JSON.stringify(Model.users)); // 保存用户列表到本地存储
        UI.footerLog(userName + '注册成功！'); // 注册成功
    }
};

// 为页面上的DOM元素（四个按钮）设置点击事件
select('button#firstWord').onclick = function() {
    Model.pos = 0; // 设置当前位置为第一个单词
    UI.printWord(); // 显示第一个单词
};

select('button#nextWord').onclick = function() {
    if (Model.pos < Model.learning.length - 1) {
        Model.pos++; // 移动到下一个单词
    } else {
        // 如果到达最后一个单词，生成新的10个单词
        generateNewWords();
    }
    UI.printWord(); // 显示当前单词
    UI.response('加油，继续吧！'); // 提示用户继续学习
};

select('button#lastWord').onclick = function() {
    Model.pos = Model.learning.length - 1; // 设置当前位置为最后一个单词
    UI.printWord(); // 显示最后一个单词
};

/**
 * 5个中文选项的动态代码，记录用户是否认识本单词
 */
UI.cnDoms = document.querySelectorAll('p.cn'); // 获取所有中文选项元素
for (let cn of UI.cnDoms) {
    cn.onclick = function() {
        let txt = cn.textContent; // 获取点击的中文选项文本
        let pos = Model.pos; // 当前单词的位置

        // 判断用户是否答对
        if (txt === Model.learning[pos].cn) {
            UI.response("答对了!"); // 答对提示
            Model.learning[pos].level--; // 降低单词熟练度
            this.className += ' right'; // 添加正确样式
        } else {
            UI.response("答错了!"); // 答错提示
            Model.learning[pos].level++; // 增加单词熟练度
            this.className += ' wrong'; // 添加错误样式
        }

        Model.learning[pos].timer = new Date(); // 记录答题时间
    };
}

// 保存单词点击事件处理函数
select('button#saveWord').onclick = function() {
    let learned = Model.learned; // 获取已学单词列表

    // 更新已学单词列表
    for (let word of Model.learning) {
        let found = false;
        for (let l of learned) {
            if (l.sn === word.sn) {
                if (word.timer) l.timer = word.timer; // 更新答题时间
                if (word.level < l.level) l.level = word.level; // 更新熟练度
                found = true;
                break;
            }
        }
        if (!found) {
            let w = {
                sn: word.sn,
                level: word.level,
                timer: word.timer
            };
            learned.push(w); // 添加新单词
        }
    }

    // 保存已学单词列表到本地存储
    let str = JSON.stringify(learned);
    localStorage.setItem(Model.user + '-learned', str);
    UI.log("您曾学过单词总计： " + learned.length + " 个！"); // 提示用户已学单词数量
    UI.userStatus(); // 更新用户状态

    // 检查 learned 列表的长度
    console.log('已学单词数量:', learned.length);
};

// 复习单词点击事件处理函数
select('button#reviewWord').onclick = function() {
    let learned = Model.learned; // 获取已学单词列表

    // 检查是否可以进入复习环节
    if (learned.length >= 2 * Model.numOfLearning) {
        Model.learning = []; // 重置学习列表
        let randLearned = function() {
            let rand = Math.floor(Math.random() * learned.length); // 随机选择一个已学单词
            let word = learned[rand];
            if (word.level < 1) {
                randLearned(); // 如果单词熟练度过低，重新选择
            } else {
                return word; // 返回选中的单词
            }
        };

        // 生成复习单词列表
        for (let i = 0; i < Model.numOfLearning; i++) {
            let word = randLearned();
            if (word) {
                let en = Model.CET6[word.sn].en;
                let pn = Model.CET6[word.sn].pn;
                let cn = Model.CET6[word.sn].cn;
                word.cn = cn;
                word.en = en;
                word.pn = pn;
                Model.learning.push(word); // 添加到复习列表
            }
        }

        Model.pos = 0; // 设置当前位置为第一个单词
        Model.numOfLearning = Model.learning.length; // 更新学习单词数量
        UI.printWord(); // 显示当前单词
        UI.response('复习' + Model.learning.length + '个单词！'); // 提示用户复习单词数量
    } else {
        UI.log('您没背完2组单词,0不能进入复习环节!'); // 提示用户未完成足够多的单词学习
    }
}; // reviewWord 结束

// 创建全局函数，用于选择DOM元素
function select(s) {
    let dom = document.querySelector(s); // 选择指定的DOM元素
    return dom; // 返回选中的DOM元素
}

// 生成新的10个单词
function generateNewWords() {
    let learning = [];
    for (let i = 0; i < Model.numOfLearning; i++) {
        let rand = Math.floor(Math.random() * Model.CET6.length); // 随机选择一个单词
        let word = Model.CET6[rand];
        word.sn = rand; // 记录单词索引
        learning.push(word); // 添加到学习列表
    }
    Model.learning = learning; // 更新模型中的学习列表
    Model.pos = 0; // 重置当前位置为第一个单词

    // 更新已背过的单词数
    Model.learned.push(...Model.learning);
    UI.log("您已背过单词总计： " + Model.learned.length + " 个！"); // 提示用户已背单词数量
    UI.userStatus(); // 更新用户状态
}