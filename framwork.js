
//#region bestjs游戏脚本框架

function warning(str){
    log("warning:" + str);
}

//#region 工具函数 futil 主要用showColors输出像素组
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
        return str;
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

//#region class Color 颜色对象,整型颜色的升级版
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

//#region class Region 矩形区域
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

//#region class ColorDxDy 颜色与坐标差
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

//#region class Point 坐标点
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

//#region class PixelGroup 像素组（颜色组） 用于多点找色
/**
 * 像素组（颜色组）
 * @param {Object} obj 旧式颜色组定义 可以利用futil.showColors生成
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
/**
 * 获取颜色列表
 */
PixelGroup.prototype.colorsToArr = function () {
    let arr = new Array(this.colors.length);
    for (let i = 0; i < this.colors.length; i++) {
        arr[i] = this.colors[i].toArray();
    }
    return arr;
}
/**
 * 寻找此像素组
 * @param {Image} img 图片，可选，默认为截图
 * @returns {Point} 像素组的左上角，如果找不到，返回null
 */
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
/**
 * 一直寻找直到找到或者超时
 * @param {number} timeout 超时时间，单位ms，可选，默认无限大
 * @param {Image} img 图片，可选，默认截图
 * @returns {Point} 像素组的左上角，如果找不到，返回null
 */
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
/**
 * 持续点击直到该像素组找不到了
 * @param {number} timeout 超时时间，单位ms，可选，默认无限大
 * @returns {boolean} 是否成功点击
 */
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

//#region class ErrorHandle 全局错误情况处理，例如断网重连等情况
/**
 * 全局错误情况处理，例如断网重连、金币不足等等情况
 * @constructor
 */
function ErrorHandle(){
    /**
     * 像素组，用于识别错误页面
     * @type {PixelGroup}
     */
    this.pixelGroup = null;
    /**
     * 处理函数，用于处理错误
     * @type {()=>void}
     */
    this.handle = null;
}
//#endregion

//#region class Route 路径，有向图中的边
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

//#region class Scene 场景，有向图中的节点
/**
 * 场景
 * @constructor Scene
 */
function Scene() {
    /**
     * 颜色组，唯一标识当前场景
     * @type {PixelGroup}
     */
    this.pixelGroups = null;
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

//#region class Task 任务 脚本的目标
/**
 * 任务 脚本的目的是完成所有任务
 * @constructor
 */
function Task(){
    /**
     * 起始场景（任务的入口场景），执行此任务的前提是处于该场景
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

//#region class Graph 整体有向图
/**
 * 有向图 图的节点是Graph，边是Route
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
    //To Do 从scene开始广度优先找到当前场景
}
/**
 * 判断当前是否是该场景
 * @param {Scene} scene 场景
 */
Graph.prototype.isScene = function(scene){
    return scene.find();
}
/**
 * 获取两点最短路径
 * @param {Scene} fromScene 起点
 * @param {Scene} toScene 终点
 * @returns {Array<Route>} 路径数组，若不可达返回null
 */
Graph.prototype.getRoutes = function(fromScene, toScene){
    //to do 双向广度优先搜索寻找最短路
    return [];
}
/**
 * 获取两个场景的路径长度
 * @param {Scene} fromScene 起点
 * @param {Scene} toScene 终点
 * @returns {number} 长度，若不可达返回-1
 */
Graph.prototype.getLength = function(fromScene, toScene){
    fromScene = fromScene || this.getNowScene();
    let routes = this.getRoutes(fromScene, toScene);
    if (routes == null){
        return -1;
    }
    return routes.length;
}
/**
 * 
 * @param {Scene} fromScene 起点，可选，默认为当前场景
 */
Graph.prototype.getNearestScene = function(fromScene){
    fromScene = fromScene || this.getNowScene();
    //to do 广度优先搜索
}
/**
 * 前往目标场景
 * @param {Scene} scene 目标场景
 */
Graph.prototype.goto = function (scene){
    let routes = this.getRoutes(this.getNowScene(), scene);

    //若无路则报错
    if (routes == null){
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

//#region class TaskScheduling 任务调度
/**
 * 任务调度，通过一定规则选择应该进行的任务
 * @constructor
 */
function TaskScheduling(){
    /**
     * 当前运行的任务
     * @type {Task}
     */
    this.runningTask = null;
    /**
     * 任务列表
     * @type {Array<Task>}
     */
    this.tasks = new Array();
}

/**
 * 确定任务的优先级别，数字越大优先级越高
 * @param {Task} task 任务
 */
TaskScheduling.prototype.getValue = function(task){
    let maxTime = 24 * 3600000;
    let time = maxTime;
    if (task.data.getEndTime()){
        time = task.data.getEndTime().getTime() - new Date().getTime();
    }
    //时间紧急程度，越接近结束时间数字越大，最小值1，
    let timeValue = maxTime / time;
    //自定义优先级，默认1000
    let priorityValue = task.data.priority;
    //路径长度，单位1
    let routeLength = Application.instance.graph
        .getLength(null, task.startScene);
    
    //各权值可根据情况修改
    return timeValue * 100
        + priorityValue
        + routeLength * 500;
}
/**
 * 根据优先级选择下一个任务
 * @returns {Task} 下一个任务，若无可执行任务，返回null
 */
TaskScheduling.prototype.selectTask = function(){
    //To do 待完成，这里为了测试直接按顺序执行了
    let i = 0;
    if (this.runningTask != null){
        i = this.tasks.indexOf(this.runningTask) + 1;
    }
    if (i < this.tasks.length)
        return this.tasks[i];
    return null;
}
/**
 * 执行任务 
 * @param {Task} task 待执行的任务
 */
TaskScheduling.prototype.doTask = function(task){
    this.runningTask = task;
    return Application.instance.graph.doTask(task);
}
TaskScheduling.prototype.selectAndDoTask = function(){
    let task = this.selectTask();
    let ok = false;
    if (task)
        ok = this.doTask(task);
    return {task:task, ok:ok};
}
//#endregion

//#region class Data 保存任务的次数、时间等信息
/**
 * 保存任务的次数、时间等信息，用于判断任务当前是否可做
 * @constructor Data
 * @param {string} name 名称
 * @param {number} defaultValue 次数
 * @param {number} descValue 玩一次减少的次数，可选，默认1
 * @param {number} deltaTime 两次时间间隔,单位ms，可选
 * @param {Date} endTime 结束时间，可选
 * @param {number} priority 优先级，越大越高，默认1000
 */
function Data(name, defaultValue, descValue, deltaTime, endTime, priority){
    this.name = name;
    this.defaultValue = defaultValue;
    this.descValue = descValue || 1;
    this.deltaTime = deltaTime;
    this.endTime = endTime;
    this.priority = priority || 1000;
}
Data.prototype.getEndTime = function(){
    return this.endTime;
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
    if (this._timeDescRestTime(new Date()).toDateString() !=
        this._timeDescRestTime(d.time).toDateString()){
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

//#region class Config 全局配置
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

//#region class BestjsEvent 事件类
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

//#region class Application 应用类
/**
 * 应用类，不要自行实例化
 * @constructor
 */
function Application(){
    /**
     * 初始化
     */
    this.onInit = new BestjsEvent();
    this.beforeRun = new BestjsEvent();
    this.afterRun = new BestjsEvent();
    this.onExit = new BestjsEvent();

    /**
     * 全局配置，需要在初始化阶段设置，可以用代码设置或者读取配置文件（推荐）
     * @type {Config}
     */
    this.config = new Config();
    /**
     * 游戏场景图
     * @type {Graph}
     */
    this.graph = new Graph();

    this.taskScheduling = new TaskScheduling();

}

//#region 注册内容
/**
 * 注册场景
 * @param {Scene} scene 场景
 */
Application.prototype.registerScene = function(scene){
    this.graph.addScene(scene);
}

/**
 * 注册错误处理
 * @param {ErrorHandle} errorHandle 错误处理对象
 */
Application.prototype.registerErrorHandle = function(errorHandle){
    var _captureScreen = captureScreen;
    captureScreen = function(){
        var img = _captureScreen();
        while (errorHandle.pixelGroup.find(img)){
            errorHandle.handle();
        }
    };
}

/**
 * 注册任务
 * @param {Task} task 任务
 */
Application.prototype.registerTask = function(task){
    if (this.taskScheduling.tasks.indexOf(task) == -1)
        this.taskScheduling.tasks.push(task);
}

//#endregion


Application.prototype._run = function(){
    while (true){
        let ret = this.taskScheduling.selectAndDoTask();
        if (ret.task == null){
            break;
        }
    }
}

/**
 * 脚本运行的主体
 */
Application.prototype.main = function (){
    let exit = this.onExit;
    events.on("exit", function(){
        exit.invoke(this);
    });

    this.onInit.invoke(this);
    this.beforeRun.invoke(this);
    this._run();
    this.afterRun.invoke(this);
}
Application.instance = new Application();
//#endregion

//#region 初始化 init
/**
 * 默认初始化
 */
function init() {
    //防止重复运行，有待改进
    if (engines.all().length > 1) {
        log("重复运行，自动退出");
        engines.myEngine().forceStop();
    }
    //请求截图，默认横屏，如果是竖屏游戏改成>号，这里用分辨率比较是为了手机、平板、模拟器统一
    requestScreenCapture(device.width < device.height);
}
Application.instance.onInit.add(init);
//#endregion


//#endregion


//#region demo

//#region 可以放到资源文件里面的数据

//#region 配置数据，建议放到配置文件里面
let appName = "xyz.bestjs.framwork";
let resetTime = 3 * 3600 * 1000;   //凌晨3点重置
//#endregion 配置数据，建议放到配置文件里面

//#region 像素组数据，可以从futil.showColors直接得到，可以放文件里面，并且根据不同分辨率读取不同的文件
let demoPixelGroup1 = new PixelGroup({
	first: 0x0e0f12,
	colors: [
		[0, 0, 0x0e0f12],
		[0, 1, 0x0e0f12],
		[0, 2, 0x0e0f12],
		[0, 3, 0x0e0f12],
		[0, 4, 0x0e0f12],
		[0, 5, 0x0e0f12],
		[0, 6, 0x0e0f12],
		[0, 7, 0x0e0f12],
		[0, 8, 0x0e0f12],
		[0, 9, 0x0e0f12],
		[0, 10, 0x0e0f11],
		[0, 11, 0x0d0e11],
		[0, 12, 0x0d0e11],
		[0, 13, 0x0d0e11],
		[0, 14, 0x0e0f11],
		[0, 15, 0x0d0e11],
		[0, 16, 0x0d0e11],
		[0, 17, 0x0d0e10],
		[0, 18, 0x0d0e10],
		[0, 19, 0x0d0e10],
	],
	regions: [[100, 150, 1, 1]]
});
//#endregion 像素组数据

//#endregion 可以放到资源文件里面的数据

let application = Application.instance;

//或者直接执行代码也行
application.onInit.add(function(){
    let config = Application.instance.config;
    config.appName = appName;
    config.resetTime = resetTime;
});

application.onExit.add(function(){
    toastLog("结束运行");
});

let scene1 = new Scene();
scene1.pixelGroups = demoPixelGroup1;

let task1 = new Task();
task1.startScene = scene1;
task1.do = function(){
    toastLog("执行例子任务1");
    return this.startScene.pixelGroups.clickUntilNone(1000);
}

application.registerScene(scene1);
application.registerTask(task1);

//注册完所有内容然后运行application.main()就完事了

//开发前利用showColors得到像素组数据
//例如此处得到(100,150)为起点竖直向下20个像素点的数据
//从控制台复制这些数据就行，或者将返回值setClip。
let getPixelGroup = false;
if (getPixelGroup){
    init();
    futil.showColors(100, 150, 1, 20);
}
else
    application.main();


//#endregion demo