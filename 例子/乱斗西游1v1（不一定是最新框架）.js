
//#region bestjs游戏脚本框架

function warning(str){
    log("warning:" + str);
}

//#region 工具函数 futil
let futil = {
    private: {
        getColor: function (cstr) {
            if (typeof (cstr) != "string") {
                for (x in cstr) {
                    log(x)
                }
                throw "TypeError()"
            }
            return cstr.replace("#ff", "0x");
        }
    },
    showColors: function (posx, posy, dx, dy) {
        let img = captureScreen();
        let str = "\nnew PixelGroup({\n";
        str = str + "\tfirst: " + (this.private.getColor(colors.toString(images.pixel(img, posx, posy)))) + ",\n";
        str = str + "\tcolors: [\n";
        for (let i = 0; i < dx; i++) {
            for (let j = 0; j < dy; j++) {
                str = str + "\t\t[" + i + ", " + j + ", " + (this.private.getColor(colors.toString(images.pixel(img, posx + i, posy + j)))) + "],\n";
            }
        }
        str = str + "\t],\n";
        str = str + "\tregions: [[" + posx + ", " + posy + ", 1, 1]]\n";
        str = str + "})";
        log(str);
    },
    addMethod: function (object, name, fn) {
        var old = object[name]; //把前一次添加的方法存在一个临时变量old里面
        object[name] = function () { // 重写了object[name]的方法
            //如果调用object[name]方法时，传入的参数个数跟预期的一致，则直接调用
            if (fn.length === arguments.length) {
                return fn.apply(this, arguments);
                // 否则，判断old是否是函数，如果是，就调用old
            } else if (typeof old === "function") {
                return old.apply(this, arguments);
            }
        }
    }

}
//#endregion

//#region class Color
/**
 * 颜色对象,整型颜色的升级版
 * @param {number | string} color Autojs的颜色
 */
function Color(color) {
    if (typeof (color) == "string") {
        color = colors.parseColor(color);
    }
    if (typeof (color) != "number") {
        throw TypeError("color must be number");
    }
    this.color = color;
}
Color.prototype.toString = function () {
    return colors.toString(this.color);
}
Color.prototype.getInt = function () {
    return this.color;
}
Color.prototype.a = function () {
    return colors.alpha(this.color);
}
Color.prototype.r = function () {
    return colors.red(this.color);
}
Color.prototype.g = function () {
    return colors.green(this.color);
}
Color.prototype.b = function () {
    return colors.blue(this.color);
}
//#endregion

//#region class Region
/**
 * 矩形区域
 * 
 * 重载1：
 * @param {number} x x坐标
 * @param {number} y y坐标
 * @param {number} w 宽
 * @param {number} h 高
 * 
 * 重载2：
 * @param {Array<number>} arr x,y,w,h
 */
function Region(x, y, w, h) {
    if (arguments.length == 1 && x instanceof Array) {
        let arr = x;
        if (!(arr instanceof Array)) {
            throw TypeError();
        }
        if (arr.length < 4) {
            throw RangeError();
        }
        this.x = arr[0];
        this.y = arr[1];
        this.w = arr[2];
        this.h = arr[3];
    } else {
        w = w || 0;
        h = h || 0;
        if (typeof (x) != "number" || typeof (y) != "number"
            || typeof (w) != "number" || typeof (h) != "number") {
            throw TypeError();
        }
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

Region.prototype.toArray = function () {
    return [this.x, this.y, this.dx, this.dy];
}
Region.prototype.toString = function () {
    return "{x: " + this.x + ", y: " + this.y
        + ", w: " + this.w + ", h: " + this.h + "}";
}
//#endregion

//#region class ColorDxDy
/**
 * 颜色与坐标差
 * @param {Color | number | string} color 颜色
 * @param {number} dx 与起始点x坐标的差
 * @param {number} dy 与起始点y坐标的差
 */
function ColorDxDy(dx, dy, color) {
    if (arguments.length == 1) {
        if (!(dx instanceof Array) || dx.length != 3) {
            throw TypeError();
        }
        let arr = dx;
        this.dx = arr[0];
        this.dy = arr[1];
        this.color = new Color(arr[2]);
    } else {
        if (!(color instanceof Color) || typeof (dx) != "number" || typeof (dy) != "number") {
            throw TypeError();
        }
        if (!(color instanceof Color)) {
            color = new Color(color);
        }
        this.color = color;
        this.dx = dx;
        this.dy = dy;
    }
}
ColorDxDy.prototype.toArray = function () {
    return [this.dx, this.dy, this.color.getInt()];
}
ColorDxDy.prototype.toString = function () {
    return "{dx: " + this.dx + ", dy: " + this.dy
        + ", color: " + this.color.toString() + "}";
}
//#endregion

//#region class Point
function Point(x, y) {
    if (arguments.length == 1) {
        this.x = x.x;
        this.y = x.y;
    } else {
        if (typeof (x) != "number" || typeof (y) != "number") {
            throw TypeError();
        }
        this.x = x;
        this.y = y;
    }
}
Point.prototype.click = function () {
    click(this.x, this.y);
    return this;
}
//#endregion

//#region class PixelGroup
/**
 * 像素组（颜色组）
 * @param {Object} obj 旧式颜色组定义
 */
function PixelGroup(obj) {
    this.first = new Color(obj.first);
    if (!(obj.colors instanceof Array)) {
        throw TypeError();
    }
    this.colors = new Array(obj.colors.length);
    for (let i = 0; i < obj.colors.length; i++) {
        this.colors[i] = new ColorDxDy(obj.colors[i]);
    }
    this.regions = new Array(obj.regions.length);
    for (let i = 0; i < obj.regions.length; i++) {
        this.regions[i] = new Region(obj.regions[i]);
    }
    let threshold = obj.threshold || 0;
    if (typeof (threshold) != "number") {
        throw TypeError();
    }
    this.threshold = threshold;
}
PixelGroup.prototype.colorsToArr = function () {
    let arr = new Array(this.colors.length);
    for (let i = 0; i < this.colors.length; i++) {
        arr[i] = this.colors[i].toArray();
    }
    return arr;
}
PixelGroup.prototype.find = function (img) {
    img = img || captureScreen();
    for (let i = 0; i < this.regions.length; i++) {
        let p = images.findMultiColors(img, this.first.getInt(), this.colorsToArr(), {
            region: this.regions[i].toArray(),
            threshold: this.threshold
        });
        if (p) {
            return new Point(p);
        }
    }
    return null;
}
PixelGroup.prototype.findOne = function (timeout, img) {
    timeout = timeout || Number.MAX_VALUE;
    let t = 0;
    let minWait = 1000;
    while (t < timeout) {
        let p = this.find(img);
        if (p) {
            return p;
        }
        sleep(minWait);
        t += minWait;
    }
    return null;
}
PixelGroup.prototype.findAndClick = function (img){
    let p = this.find(img);
    if (p){
        p.click();
        return true;
    }
    return false;
}
PixelGroup.prototype.findAndDo = function (fn, img){
    let p = this.find(img);
    if (p){
        return fn(p) || true;
    }
    return false;
}
PixelGroup.prototype.findOneAndClick = function (timeout, img){
    let p = this.findOne(timeout, img);
    if (p){
        p.click();
        return true;
    }
    return false;
}
PixelGroup.prototype.findOneAndDo = function (fn, timeout, img){
    let p = this.findOne(timeout, img);
    if (p) {
        return fn(p) || true;
    }
    return false;
}
PixelGroup.prototype.clickUntilNone = function (timeout){
    let t = 0;
    timeout = timeout || Number.MAX_VALUE;
    let minWait = 300;
    let times = 0, shouldNoneTimes = 5;//连续5次找不到才退出
    let ret = false;
    if (!this.findOneAndClick(timeout))
        return false;
    while (t < timeout){
        if (!this.findAndClick()){
            times++;
            if (times >= shouldNoneTimes){
                break;
            }
        }else {
            ret = true;
            times = 0;
        }
        sleep(minWait);
        t += minWait;
    }
    return ret;
}
PixelGroup.prototype.toString = function () {
    let sb = "\n{\n";
    sb += "\tfirst: " + this.first.toString() + ",\n";
    sb += "\tcolors: [\n";
    for (let i = 0; i < this.colors.length; i++) {
        sb += "\t\t" + this.colors[i].toString() + ",\n";
    }
    sb += "\t],\n";
    sb += "\tregions: [\n";
    for (let i = 0; i < this.regions.length; i++) {
        sb += "\t\t" + this.regions[i].toString() + ",\n";
    }
    sb += "\t],\n";
    sb += "\tthreshold: " + this.threshold + "\n";
    sb += "}";
    return sb;
}

//#endregion

//#region class Route
/**
 * 路径，有向图中的边，包含一个场景前往另一个场景的方法
 * @constructor
 */
function Route(){
    /**
     * 起始场景
     * @type {Scene}
     */
    this.from = null;
    /**
     * 目标场景
     * @type {Scene}
     */
    this.to = null;
    /**
     * 从from到to的方法，需确保能够到达该场景
     */
    this.goto = function(){}
}
Route.prototype.setFrom = function(from){
    if (!(from instanceof Scene)){
        throw TypeError();
    }
    this.from = from;
}
Route.prototype.setTo = function(to){
    if (!(to instanceof Scene)){
        throw TypeError();
    }
    this.to = to;
}
/**
 * 设置goto方法
 * @param {(route:Route) => void} fgoto 从from到to的方法
 */
Route.prototype.setGoto = function(fgoto){
    if (!(fgoto instanceof Function)){
        throw TypeError();
    }
    this.goto = function(){
        if (!this.from.find()){
            throw "不在此场景：" + this.from.toString();
        }
        while (!this.to.find()){    //有时会前往失败
            fgoto(this);
            sleep(500);
        }
    }
}
//#endregion

//#region class Scene
/**
 * 场景
 * @constructor Scene
 */
function Scene() {
    /**
     * 颜色组，唯一标识当前场景
     * @type {PixelGroup}
     */
    this.pixelGroups = new PixelGroup();
    /**
     * 路线列表，所有到达当前场景的路线
     * @type {Array<Route>}
     */
    this.to = new Array();
    /**
     * 路线列表，所有从当前场景出发的路线
     * @type {Array<Route>}
     */
    this.from = new Array();
    /**
     * 任务，可选，如果非空表示该场景是某任务的入口
     * @type {Task}
     */
    this.task = null;
}
Scene.prototype.find = function (){
    return this.pixelGroups.find();
}
//#endregion

//#region class Task
/**
 * 任务
 * @constructor
 */
function Task(){
    /**
     * 起始场景，执行此任务的前提是处于该场景
     * @type {Scene}
     */
    this.startScene = new Scene();
    /**
     * 结束场景，执行任务后应该处于哪个场景
     * @type {Scene}
     */
    this.finishScene = new Scene();
    /**
     * 存储次数数据，用于判断是否能进行任务
     * @type {Data}
     */
    this.data = new Data();
    /**
     * 任务主体，执行该任务，返回成功或者失败,
     * 若成功，将扣除相应的次数，
     * 若失败，如果当前data为可做则给出警告
     * @type {()=>boolean}
     */
    this.do = null;
}
/**
 * 设置执行任务的方法
 * @param {(this:Task)=>boolean} fn 任务主体
 */
Task.prototype.setDo = function (fn){
    if (!this.data.can()){  //如果不能执行任务，说明存在bug错误调用了此方法
        warning("当前不能进行任务");
        return false;
    }
    if (!this.startScene.find()){
        throw "不在起始场景，无法执行任务：" + this.toString();
    }
    if (fn(this)){
        this.data.do();
    } else {
        if (this.data.can()){
            throw "当前任务不能执行，数据错误：" + this.data.toString();
        }
    }
}

//#endregion

//#region class Graph
/**
 * 有向图
 * @constructor
 */
function Graph(){
    /**
     * 场景列表
     * @type {Array<Scene>}
     */
    this.scenes = new Array();
    /**
     * 当前场景
     * @type {Scene}
     * @private
     */
    this.nowScene = new Scene();
}
/**
 * 添加场景
 * @param {Scene} scene 场景
 */
Graph.prototype.addScene = function (scene){
    if (this.scenes.indexOf(scene) < 0){
        this.scenes.push(scene);
    }
}
/**
 * 获取当前场景
 * @param {Scene} scene 当前可能的场景，可选
 */
Graph.prototype.getNowScene = function(scene){
    scene = scene || this.nowScene;
    //To Do 从nowScene开始广度优先找到当前场景
}
/**
 * 判断当前是否是该场景
 * @param {Scene} scene 场景
 */
Graph.prototype.isScene = function(scene){
    return scene.find();
}
/**
 * 前往目标场景
 * @param {Scene} scene 目标场景
 */
Graph.prototype.goto = function (scene){
    //To Do 双向广度优先搜索寻找最短路
    /**@type {Array<Route>} */
    let routes = new Array();
    let ok = false;

    //若无路则报错
    if (!ok){
        throw "无法到达指定场景：" + scene.toString();
    }

    //找到后按照路线前往
    for (let i = 0; i < routes.length; i++){
        routes[i].goto();
        this.getNowScene(routes[i].to);
    }
}
/**
 * 前往指定场景并运行指定任务
 * @param {Task} task 目标任务
 */
Graph.prototype.doTask = function(task){
    this.goto(task.startScene); //前往任务的起始场景
    let ok = task.do();
    this.getNowScene(task.finishScene);
    return ok;
}
//#endregion

//#region class Data
/**
 * 保存任务的次数、时间
 * @constructor Data
 * @param {string} name 名称
 * @param {number} defaultValue 次数
 * @param {number} descValue 玩一次减少的次数，可选，默认1
 * @param {number} deltaTime 两次时间间隔,单位ms，可选
 */
function Data(name, defaultValue, descValue, deltaTime){
    this.name = name;
    this.defaultValue = defaultValue;
    this.descValue = descValue || 1;
    this.deltaTime = deltaTime;
}
/**
 * @private
 */
Data.prototype._getStorge = function (){
    return storages.create(Application.instance.config.appName);
}
/**
 * 读取存储内容
 * @private 
 * @param {string} key 键，可选，默认为name
 * @param {object} defaultValue 默认值，若获取失败则返回该值
 * @returns {object} 
 */
Data.prototype._get = function (key, defaultValue){
    key = key || this.name;
    return this._getStorge().get(key, defaultValue);
}
/**
 * 存储数据
 * @private
 * @param {string} key 键
 * @param {string | number | object} value 值
 */
Data.prototype._put = function (key, value){
    key = key || this.name;
    return this._getStorge().put(key, value);
}
/**
 * 对应时间的key
 * @private
 * @returns {string} key
 */
Data.prototype._timeKey = function(){
    return this.name + "_time";
}
/**
 * 读取任务的次数、时间
 */
Data.prototype.get = function (){
    return {
        value: this._get(),
        time: new Date(this._get(this._timeKey()))
    }
}
/**
 * 保存数据及当前时间
 * @param {number | string | object} value 值
 */
Data.prototype.put = function(value){
    this._put(this.name, value);
    this._put(this._timeKey(), new Date().getTime());
}
/**
 * 数据初始化，处理新建数据
 * @private
 */
Data.prototype._init = function(){
    let d = this.get();
    if (d.value == null || d.time == null){
        log("数据初始化：" + this.name);
        this.put(this.defaultValue);
    }
}
/**
 * 将时间减去重置时间
 * @private
 * @param {Date} time 时间
 */
Data.prototype._timeDescRestTime = function(time){
    return new Date(time.getTime() - Application.instance.config.resetTime);
}
/**
 * 获取当前能否玩一次
 * @returns {boolean} 是否可以玩一次
 */
Data.prototype.can = function(){
    this._init();
    let d = this.get();
    let ok = false;
    //去掉重置时间后，如果不在同一天，那么今天有次数
    if (this._timeDescRestTime(new Date()).getDate() >
        this._timeDescRestTime(d.time).getDate()){
            ok = true;
    } else {
        //否则的话，剩余次数至少要能玩一次
        ok = d.value >= this.descValue;
    }
    //如果规定了时间间隔，还需要检查两次时间间隔
    if (ok && this.deltaTime){
        ok = new Date().getTime() - d.time.getTime() >= this.deltaTime;
    }
    return ok;
}
/**
 * 玩一次，减去对应的次数并存储
 */
Data.prototype.do = function(){
    this._init();
    let d = this.get();
    //重置了就是默认数量减一次玩耍的数量
    if (this._timeDescRestTime(new Date()).getDate() >
        this._timeDescRestTime(d.time).getDate()){
        this.put(this.defaultValue - this.descValue);
    }else {
        if (d.value < this.descValue){
            throw "次数不足，无法减去对应次数：" + this.toString();
        }
        this.put(d.value - this.descValue);
    }
}
//#endregion

//#region class Config
/**
 * 全局配置
 */
function Config(){
    /**
     * 当前应用唯一标识名称
     * @type {string}
     */
    this.appName = null;
    /**
     * 游戏重置时间，单位ms，默认为0
     * @type {number}
     */
    this.resetTime = 0;
}


//#endregion

//#region class BestjsEvent
/**
 * 事件类
 * @constructor BestjsEvent
 */
function BestjsEvent(){
    /**
     * 事件监听函数列表，内部维护
     * @type {Array<(sender:Object,ojb?:Object) => void>}
     */
    this.eventList = new Array();
}
/**
 * 触发事件
 * @param {object} sender 发送者
 * @param {object} obj 附加数据，可选
 */
BestjsEvent.prototype.invoke = function (sender, obj){
    for (let i = 0; i < this.eventList.length; i++){
        this.eventList[i](sender, obj);
    }
}
/**
 * 添加时间监听函数
 * @param {function} fn 事件监听函数
 */
BestjsEvent.prototype.add = function (fn) {
    return this.eventList.push(fn);
}
/**
 * 去掉事件监听函数
 * @param {function} fn 事件监听函数
 */
BestjsEvent.prototype.remove = function (fn){
    let index = this.eventList.indexOf(fn);
    if (index < 0){
        return false;
    }else {
        return this.eventList.splice(index, 1);
    }
}
//#endregion

//#region class Application
/**
 * 应用类，不要自行实例化
 * 
 */
function Application(){
    this.onInit = new BestjsEvent();
    this.onRun = new BestjsEvent();
    this.onExit = new BestjsEvent();

    this.config = new Config();

    this.onInterrupt = {
        onDisconnection : new BestjsEvent()

    }
}
Application.prototype.main = function (){
    this.onInit.invoke(this);
    this.onRun.invoke(this);
    let exit = this.onExit;
    events.on("exit", function(){
        exit.invoke(this);
    });
}
// Application.prototype.register = function (){
//     this.onInit.add(init);

//     this.onExit.add()
// }
Application.instance = new Application();
//#endregion

//#region 初始化 init
/**
 * 初始化，不必修改这里
 */
function init() {
    if (engines.all().length > 1) {
        engines.myEngine().forceStop();
    }
    requestScreenCapture(device.width < device.height);
}
Application.instance.onInit.add(init);
//#endregion


//#endregion
//#region 生命周期
Application.instance.onInit.add(function(){
    let config = Application.instance.config;
    config.appName = "com.bestjs.framwork";
    config.resetTime = 3 * 60 * 1000;
});
Application.instance.onInit.add(function(){
    log("事件init");
});
Application.instance.onExit.add(function(){
    log("事件exit");
})
Application.instance.onRun.add(function(){
    log("事件run");
})
Application.instance.main();
//#endregion

//#region 颜色组 mcolors

let ld1v1cs = {
    c首页对战: new PixelGroup({
        first: 0xf0eee1,
        colors: [
            [0, 0, 0xf0eee1],
            [0, 1, 0xf2f6e8],
            [0, 2, 0xebf3e4],
            [0, 3, 0xdce5d8],
            [0, 4, 0xcacfc7],
            [0, 5, 0xb8b6b2],
            [0, 6, 0xa79d9c],
            [0, 7, 0x917e82],
            [0, 8, 0x796167],
            [0, 9, 0x6e5d5e],
            [0, 10, 0x4d3834],
            [0, 11, 0x573932],
            [0, 12, 0x56331e],
            [0, 13, 0x5b4018],
            [0, 14, 0x77664a],
            [0, 15, 0x191319],
            [0, 16, 0x0b0f1c],
            [0, 17, 0x050d0a],
            [0, 18, 0x0d0f0f],
            [0, 19, 0x120717],
        ],
        regions: [[520, 260, 1, 1]],
        threshold: 5
    }),
    c对战实时对战: new PixelGroup({
        first: 0x405259,
        colors: [
            [0, 0, 0x405259],
            [1, 0, 0x405259],
            [2, 0, 0x405259],
            [3, 0, 0x45595f],
            [4, 0, 0x495e65],
            [5, 0, 0x415359],
            [6, 0, 0x405259],
            [7, 0, 0x405259],
            [8, 0, 0x405259],
            [9, 0, 0x66868f],
            [10, 0, 0x4d636a],
            [11, 0, 0x202528],
            [12, 0, 0x1e2326],
            [13, 0, 0x4a6067],
            [14, 0, 0x617f88],
            [15, 0, 0x354348],
            [16, 0, 0x344146],
            [17, 0, 0x344146],
            [18, 0, 0x65858e],
            [19, 0, 0x465960],
        ],
        regions: [[360, 100, 1, 1]]
    }),
    c实时对战1V1: new PixelGroup({
        first: 0x0946b3,
        colors: [
            [0, 0, 0x0946b3],
            [0, 1, 0x014cb5],
            [0, 2, 0x1259a3],
            [0, 3, 0x84b1e7],
            [0, 4, 0xbcc4f1],
            [0, 5, 0xd1e1fa],
            [0, 6, 0xe0f6ff],
            [0, 7, 0xedfeff],
            [0, 8, 0xf6ffff],
            [0, 9, 0xfefef6],
            [0, 10, 0xfffcde],
            [0, 11, 0xfffde0],
            [0, 12, 0xfffaf3],
            [0, 13, 0xebf7fd],
            [0, 14, 0xa8cefe],
            [0, 15, 0x60a1e5],
            [0, 16, 0x2f7dd0],
            [0, 17, 0x2077d4],
            [0, 18, 0x197cd3],
            [0, 19, 0x0d79cd],
        ],
        regions: [[254, 200, 1, 1]]
    }),
    c1V1新北冰峡: new PixelGroup({
        first: 0xd1dbd7,
        colors: [
            [0, 0, 0xd1dbd7],
            [0, 1, 0xa6cfdb],
            [0, 2, 0x277dab],
            [0, 3, 0x4191c8],
            [0, 4, 0xe8ffff],
            [0, 5, 0xfdf9fa],
            [0, 6, 0xeeffff],
            [0, 7, 0xc6f6ff],
            [0, 8, 0x6fa0aa],
            [0, 9, 0xcbe3e1],
            [0, 10, 0xe9fdfc],
            [0, 11, 0x78b9c8],
            [0, 12, 0xb3e9f6],
            [0, 13, 0xa8d3da],
            [0, 14, 0x3fa2a8],
            [0, 15, 0x46a3a0],
            [0, 16, 0xb5d7d9],
            [0, 17, 0xcef0f9],
            [0, 18, 0x99c7e6],
            [0, 19, 0x509cb4],
        ],
        regions: [[252, 298, 1, 1]]
    }),
    c对战开始匹配: new PixelGroup({
        first: 0xeee6b4,
        colors: [
            [0, 0, 0xeee6b4],
            [0, 1, 0xc0b78c],
            [0, 2, 0x948965],
            [0, 3, 0x918663],
            [0, 4, 0x918663],
            [0, 5, 0x8f8360],
            [0, 6, 0xa09670],
            [0, 7, 0xf6efbc],
            [0, 8, 0x8a7e5c],
            [0, 9, 0x40321a],
            [0, 10, 0x2e1d07],
            [0, 11, 0x311e08],
            [0, 12, 0x613e1a],
            [0, 13, 0x915a22],
            [0, 14, 0x975718],
            [0, 15, 0x9c5c1c],
            [0, 16, 0x9b5b1b],
            [0, 17, 0x9a5a1a],
            [0, 18, 0x995919],
            [0, 19, 0x995919],
        ],
        regions: [[706, 444, 1, 1]]
    }),
    c对战房间开始匹配: new PixelGroup({
        first: 0x9b6022,
        colors: [
            [0, 0, 0x9b6022],
            [0, 1, 0x4d3112],
            [0, 2, 0xaaa079],
            [0, 3, 0xc1b78d],
            [0, 4, 0x716446],
            [0, 5, 0x55482e],
            [0, 6, 0x55482e],
            [0, 7, 0x54472d],
            [0, 8, 0x695c3f],
            [0, 9, 0xc5bc90],
            [0, 10, 0xa79d76],
            [0, 11, 0x483a22],
            [0, 12, 0x3e270b],
            [0, 13, 0x5d380f],
            [0, 14, 0x774a19],
            [0, 15, 0x975e22],
            [0, 16, 0xa16321],
            [0, 17, 0x9f601d],
            [0, 18, 0x985916],
            [0, 19, 0x985916],
        ],
        regions: [[445, 429, 1, 1]]
    }),
    c实时对战匹配成功: new PixelGroup({
        first: 0x292f34,
        colors: [
            [0, 0, 0x292f34],
            [0, 1, 0x21262c],
            [0, 2, 0x6189a2],
            [0, 3, 0x648fa9],
            [0, 4, 0x2b3740],
            [0, 5, 0x20252b],
            [0, 6, 0x20242c],
            [0, 7, 0x20242c],
            [0, 8, 0x20242c],
            [0, 9, 0x20242c],
            [0, 10, 0x20242c],
            [0, 11, 0x2b3641],
            [0, 12, 0x55778e],
            [0, 13, 0x7ab1d2],
            [0, 14, 0x587c93],
            [0, 15, 0x29323c],
            [0, 16, 0x3f5566],
            [0, 17, 0x7ab3d3],
            [0, 18, 0x334a59],
            [0, 19, 0x1c2831],
        ],
        regions: [[449, 139, 1, 1]]
    }),
    c实时对战匹配成功确认进入: new PixelGroup({
        first: 0x277488,
        colors: [
            [0, 0, 0x277488],
            [0, 1, 0x414337],
            [0, 2, 0x77827a],
            [0, 3, 0x808f88],
            [0, 4, 0x94a8a4],
            [0, 5, 0xbbddde],
            [0, 6, 0xaac6c4],
            [0, 7, 0x808f88],
            [0, 8, 0x808f88],
            [0, 9, 0x9ab1ae],
            [0, 10, 0xc5eaec],
            [0, 11, 0xb5d5d5],
            [0, 12, 0xb2d1d1],
            [0, 13, 0xbadcdd],
            [0, 14, 0x98afab],
            [0, 15, 0x545447],
            [0, 16, 0x525143],
            [0, 17, 0xa4bebc],
            [0, 18, 0xa2bbb9],
            [0, 19, 0x3c3424],
        ],
        regions: [[452, 382, 1, 1]]
    }),
    c匹配没人 : new PixelGroup({
        first: 0x322817,
        colors: [
            [0, 0, 0x322817],
            [0, 1, 0x90a49f],
            [0, 2, 0x8fa29d],
            [0, 3, 0x271805],
            [0, 4, 0x2a271a],
            [0, 5, 0x3b3a2c],
            [0, 6, 0x555548],
            [0, 7, 0x7a867e],
            [0, 8, 0xa3bdbb],
            [0, 9, 0xb6d6d6],
            [0, 10, 0x7e8c85],
            [0, 11, 0x322716],
            [0, 12, 0x2e2b1e],
            [0, 13, 0x2d362e],
            [0, 14, 0x2d3830],
            [0, 15, 0x2d3830],
            [0, 16, 0x2c3b35],
            [0, 17, 0x26545a],
            [0, 18, 0x22839e],
            [0, 19, 0x2286a2],
        ],
        regions: [[546, 333, 1, 1]]
    }),
    c实时对战选择英雄: new PixelGroup({
        first: 0x181818,
        colors: [
            [0, 0, 0x181818],
            [0, 1, 0x1f1f1f],
            [0, 2, 0x222222],
            [0, 3, 0x262626],
            [0, 4, 0x282828],
            [0, 5, 0x292929],
            [0, 6, 0x2a2a2a],
            [0, 7, 0x2a2a2a],
            [0, 8, 0x2a2a2a],
            [0, 9, 0x2a2a2a],
            [0, 10, 0x2a2a2a],
            [0, 11, 0x2a2a2a],
            [0, 12, 0x2a2a2a],
            [0, 13, 0x2a2a2a],
            [0, 14, 0x2a2a2a],
            [0, 15, 0x2a2a2a],
            [0, 16, 0x69635e],
            [0, 17, 0x5b5753],
            [0, 18, 0x383736],
            [0, 19, 0x9d9289],
        ],
        regions: [[363, 12, 1, 1]]
    }),
    c实时对战确认选择: new PixelGroup({
        first: 0x266f85,
        colors: [
            [0, 0, 0x266f85],
            [0, 1, 0x322717],
            [0, 2, 0x8c9f99],
            [0, 3, 0xc0e4e6],
            [0, 4, 0x7a867e],
            [0, 5, 0x2c1e0c],
            [0, 6, 0x271805],
            [0, 7, 0x342918],
            [0, 8, 0xcef6fa],
            [0, 9, 0x9cb3b0],
            [0, 10, 0x78847c],
            [0, 11, 0x78847c],
            [0, 12, 0x78847c],
            [0, 13, 0x78847c],
            [0, 14, 0x78847c],
            [0, 15, 0x889994],
            [0, 16, 0xc4e8ea],
            [0, 17, 0x707970],
            [0, 18, 0x312e1f],
            [0, 19, 0x22545f],
        ],
        regions: [[743, 495, 1, 1]]
    }),
    c实时对战1V1战斗中: new PixelGroup({
        first: 0x33384a,
        colors: [
            [0, 0, 0x33384a],
            [0, 1, 0x363a4c],
            [0, 2, 0x313648],
            [0, 3, 0x313648],
            [0, 4, 0x303546],
            [0, 5, 0x2e3345],
            [0, 6, 0x446582],
            [0, 7, 0x5182a5],
            [0, 8, 0x5082a5],
            [0, 9, 0x5082a5],
            [0, 10, 0x5082a5],
            [0, 11, 0x5081a5],
            [0, 12, 0x5081a5],
            [0, 13, 0x32455c],
            [0, 14, 0x416683],
            [0, 15, 0x242a3a],
            [0, 16, 0x222c3d],
            [0, 17, 0x242e40],
            [0, 18, 0x233042],
            [0, 19, 0x233144],
        ],
        regions: [[117, 20, 1, 1]],
        threshold: 5
    }),
    c对战结算: new PixelGroup({
        first: 0x14131b,
        colors: [
            [0, 0, 0x14131b],
            [0, 1, 0x14131b],
            [0, 2, 0x14131b],
            [0, 3, 0x14131b],
            [0, 4, 0x14131b],
            [0, 5, 0x14131b],
            [0, 6, 0x14131b],
            [0, 7, 0x14131b],
            [0, 8, 0x5a5a2f],
            [0, 9, 0xa59d82],
            [0, 10, 0x1d1d1f],
            [0, 11, 0x1b2026],
            [0, 12, 0x1b2026],
            [0, 13, 0x1b2026],
            [0, 14, 0x1b2026],
            [0, 15, 0x1a1f25],
            [0, 16, 0x1a1f25],
            [0, 17, 0x1a1f25],
            [0, 18, 0x1a1f25],
            [0, 19, 0x1a1f25],
        ],
        regions: [[355, 415, 1, 1]]
    }),
    c1v1结算左方点赞: new PixelGroup({
        first: 0x48494f,
        colors: [
            [0, 0, 0x48494f],
            [0, 1, 0x373a42],
            [0, 2, 0x333742],
            [0, 3, 0x313743],
            [0, 4, 0x2f3744],
            [0, 5, 0x2f3645],
            [0, 6, 0x3a3d37],
            [0, 7, 0xbcb275],
            [0, 8, 0xf7db75],
            [0, 9, 0xffe077],
            [0, 10, 0xffd586],
            [0, 11, 0xe1a96f],
            [0, 12, 0xc18f4f],
            [0, 13, 0xbc8f3d],
            [0, 14, 0xbd8c36],
            [0, 15, 0xb77b35],
            [0, 16, 0xaf6935],
            [0, 17, 0x97602f],
            [0, 18, 0x9f5b21],
            [0, 19, 0xa36229],
        ],
        regions: [[400, 178, 1, 1]]
    }),
    c1v1结算右方点赞: new PixelGroup({
        first: 0x4e5258,
        colors: [
            [0, 0, 0x4e5258],
            [0, 1, 0x373f44],
            [0, 2, 0x2d393e],
            [0, 3, 0x2d3940],
            [0, 4, 0x2e3b43],
            [0, 5, 0x2d3942],
            [0, 6, 0x303d46],
            [0, 7, 0x30393f],
            [0, 8, 0x7a765c],
            [0, 9, 0xf5e4ae],
            [0, 10, 0xc79159],
            [0, 11, 0xbd7050],
            [0, 12, 0xc36962],
            [0, 13, 0xcd7574],
            [0, 14, 0xcb7e74],
            [0, 15, 0xc07e6c],
            [0, 16, 0x5b1f15],
            [0, 17, 0x541919],
            [0, 18, 0x5d2004],
            [0, 19, 0x6e290a],
        ],
        regions: [[765, 176, 1, 1]]
    }),
    c对战结算离开: new PixelGroup({
        first: 0x289fc3,
        colors: [
            [0, 0, 0x289fc3],
            [0, 1, 0x272010],
            [0, 2, 0x64695e],
            [0, 3, 0xcaf1f4],
            [0, 4, 0x352b1a],
            [0, 5, 0x464233],
            [0, 6, 0x443e2f],
            [0, 7, 0x5c5e52],
            [0, 8, 0x737d74],
            [0, 9, 0xcbf2f5],
            [0, 10, 0x3f3828],
            [0, 11, 0x96aba7],
            [0, 12, 0x9eb6b3],
            [0, 13, 0x2e2210],
            [0, 14, 0x2a1c0a],
            [0, 15, 0x454031],
            [0, 16, 0x3a3221],
            [0, 17, 0x28271a],
            [0, 18, 0x255a64],
            [0, 19, 0x237a92],
        ],
        regions: [[553, 483, 1, 1]]
    }),
    c聊天按钮 : new PixelGroup({
        first: 0x83e3ff,
        colors: [
            [0, 0, 0x83e3ff],
            [0, 1, 0x308adb],
            [0, 2, 0x0f58ac],
            [0, 3, 0x1061bc],
            [0, 4, 0x0e58ac],
            [0, 5, 0x0c52a2],
            [0, 6, 0x0b4e9c],
            [0, 7, 0x0a4d99],
            [0, 8, 0x094b98],
            [0, 9, 0x094996],
            [0, 10, 0x084794],
            [0, 11, 0x06449f],
            [0, 12, 0x161d28],
            [0, 13, 0x1a1d20],
            [0, 14, 0x1c1e23],
            [0, 15, 0x1c1f23],
            [0, 16, 0x1c1f23],
            [0, 17, 0x1c1f23],
            [0, 18, 0x1c1f24],
            [0, 19, 0x1c1f24],
        ],
        regions: [[30, 500, 1, 1]]
    }),
    c聊天发送 : new PixelGroup({
        first: 0x9db5b2,
        colors: [
            [0, 0, 0x9db5b2],
            [0, 1, 0xacc9c8],
            [0, 2, 0x525244],
            [0, 3, 0x282719],
            [0, 4, 0x273731],
            [0, 5, 0x2f2311],
            [0, 6, 0x99b0ac],
            [0, 7, 0x8ea09b],
            [0, 8, 0x3e3727],
            [0, 9, 0x271805],
            [0, 10, 0x271805],
            [0, 11, 0x271805],
            [0, 12, 0x271805],
            [0, 13, 0x2e210f],
            [0, 14, 0x8c9e98],
            [0, 15, 0xc2e6e8],
            [0, 16, 0x737d74],
            [0, 17, 0x313125],
            [0, 18, 0x22829e],
            [0, 19, 0x2283a2],
        ],
        regions: [[400, 500, 1, 1]]
    })
}

let ld1v1ps = {
    p操纵杆 : new Point(101,463),
    p攻击键 : new Point(900,500),
    p聊天栏 : new Point(200, 510),
    p屏幕右方关闭弹窗 : new Point(800, 300)
}
//#endregion



//#region 操作 fdo
let fdo = {
    do乱斗1V1: function () {
        if (!ld1v1cs.c首页对战.find()) {
            throw "需要处于乱斗首页对战卡片";
        }
        ld1v1cs.c首页对战.clickUntilNone();
        ld1v1cs.c对战实时对战.clickUntilNone();
        ld1v1cs.c实时对战1V1.findOneAndClick();
        ld1v1cs.c1V1新北冰峡.findOneAndClick();
        ld1v1cs.c对战开始匹配.clickUntilNone();
        ld1v1cs.c对战房间开始匹配.clickUntilNone();
        log("开始匹配");
        while (!ld1v1cs.c实时对战选择英雄.find()) {
            if (ld1v1cs.c实时对战匹配成功.find()){
                log("匹配成功");
                ld1v1cs.c实时对战匹配成功确认进入.findAndClick();
            }
            ld1v1cs.c匹配没人.findAndClick();
            sleep(1000);
            // let img = captureScreen();
            // if (ld1v1cs.c实时对战选择英雄.find() ||
            //     ld1v1cs.c实时对战确认选择.find() ||
            //     ld1v1cs.c实时对战1V1战斗中.find()){
            //         break;
            // }
        }
        sleep(1000);
        click(300, 180);
        sleep(1000);
        ld1v1cs.c实时对战确认选择.findAndClick();
        log("选择完毕");
        //ld1v1cs.c实时对战1V1战斗中.findOne();
        this.f乱斗选完英雄之后的战斗();
        sleep(2000);
        log("完成");
    },
    f乱斗选完英雄之后的战斗 : function(){
        while (!ld1v1cs.c对战结算.find() && !ld1v1cs.c1v1结算左方点赞.find()) {
            this.f乱斗操纵杆移动攻击();
            sleep(500);
        }
        log("战斗结束");
        ld1v1cs.c对战结算.findAndClick();
        ld1v1cs.c1v1结算左方点赞.findOneAndClick(5000);
        ld1v1cs.c1v1结算右方点赞.findOneAndClick(5000);
        sleep(1000);
        ld1v1cs.c对战结算离开.clickUntilNone();
    },
    f乱斗操纵杆随机滑动: function () {
        let p = ld1v1ps.p操纵杆;
        swipe(p.x, p.y, this.getRandP(p.x, -50), this.getRandP(p.y, -50), 500);
        sleep(500 + Math.round(Math.random() * 2000));
    },
    getRandP: function getRandP(n, dn) {
        return n + Math.round(Math.random() * 100 + dn);
    },
    f乱斗操纵杆移动攻击: function(){
        let pc = ld1v1ps.p操纵杆;
        let pg = ld1v1ps.p攻击键;
        swipe(pc.x, pc.y, this.getRandP(pc.x, 0), this.getRandP(pc.y, -50), 1000);
        sleep(500);
        for (let i = 0; i < 3; i++){
            pg.click();
            sleep(200);
        }
        sleep(500);
    },
    do排位: function(){

    },

    do发广告: function(str){
        ld1v1cs.c聊天按钮.clickUntilNone();
        sleep(500);
        ld1v1ps.p聊天栏.click();
        sleep(1000);
        this.do输入(str);
        sleep(300);
        text("确定").findOne().click();
        sleep(500);
        ld1v1cs.c聊天发送.findAndClick();
        sleep(1000);
        ld1v1ps.p屏幕右方关闭弹窗.click();
        sleep(1000);
    },
    do输入 : function(str){
        setText(str);
    }
}
//#endregion


//#region main
//fdo.f乱斗选完英雄之后的战斗();
while (true) fdo.do乱斗1V1();   //这一行无限打实时对战1V1

//futil.showColors(400,500, 1, 20);
function main1v1(){
    toastLog("开始运行");
    fdo.do发广告('[自动消息]加群590630228免费得自动打1v1程序');
    while (true) fdo.do乱斗1V1();   //这一行无限打实时对战1V1
}
//while (true) fdo.f乱斗操纵杆移动攻击(); //这一行无限右走攻击



//#endregion

var ld1v1 = {};
ld1v1.main = main1v1;
module.exports = ld1v1;
