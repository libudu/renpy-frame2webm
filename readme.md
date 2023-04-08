## 解决的问题

Renpy 中如何实现人物的动态立绘？

在 Renpy 的 live2d 模块正式支持之前，想要在 Renpy 中加载带动态的人物立绘基本只能采用**帧动画**的方式。

但是由于帧动画性能较差，根据 apoto 在罗曼和灵龙岛项目中的实践，哪怕对图片采用高压缩（比如使用我的上一个项目 ultra-tinypng 进行压缩），也必须以 720p 画质、低帧率再加上一定抽帧才能流畅运行。尽管如此，同屏出现多个人物时还是可能出现无法预料、无法解决的卡顿。

那么能不能不使用帧动画，而是处理成一个相对于庞大的帧动画来说很小、只需要加载一次的**视频文件**，比如 webm，在游戏中加载成动态的人物立绘呢？

答案是可以的，并且效果很好。尽管探索过程非常曲折麻烦，但是使用本项目可以很低成本、快速地实现该效果。

感谢**伊万德**酱对于本项目的支持，最初 idea 的提出以及关键的 ffmpeg 命令都是他贡献的。

## 如何在 Renpy 中将 webm 加载为人物立绘

我们以人物 napoleon 的 happy 表情为例

假设人物 napoleon 的 happy 表情的 webm 文件在 renpy 项目目录中的路径如下：images/characters/napoleon/happy.webm

那么在 Renpy 代码中，我们应该这样将 webm 文件加载为 Movie 对象，再加载为可视组件，再注册为 renpy 的人物表情：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm")
    renpy.image("linpicio happy", Transform(movie, zoom = 1.5))
```

![image](/readme_assets/1.gif)

可以看到，webm 视频在人物边缘变动时会出现很难看的白点锯齿，这几乎是不可接受的。

为了解决这个问题，参考了 renpy 的文档后，发现是需要增加一个 mask，作为可视组件的 alpha 通道。这个 mask 视频是这样的：

![image](/readme_assets/2.gif)

添加了 mask 之后，效果已经很接近于可用了：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm", mask = "characters/napoleon/happy_mask.webm")
```

![image](/readme_assets/3.gif)

然而，当同屏出现较多人物、场景前后过渡切换的时候，“得益于”Renpy 强大的资源加载能力，有时人物会出现非常奇怪的轻微拖影。尽管效果较为轻微，但是仔细留意发现后会感觉非常出戏和奇怪。

查阅了大量资料和源码后，发现是 Renpy 对于 Movie 和 mask 的加载时间差导致出现了帧不同步问题。要解决这个需要使用 side_mask 特性：

> side_mask
> 
> 若为 True，Ren’Py 会将该 Movie 对象设置为水平并排 (side-by-side)mask 模式。Movie 对象将被对等分割为两部分。左半为颜色信息，右半为 alpha 通道信息。对应的可视组件宽度也为该视频文件的一半。
> 
> 尽可能使用 mask 而不是 side_mask，除非有帧同步问题。

简单来说，side_mask 要求将 webm 文件和其 mask 文件合成一个文件，一个在左半边一个在右半边。因为就是一个视频，自然就不会出现帧不同步了。

合成后的视频看起来是这样的：

![image](/readme_assets/4.png)

再次运行游戏后，发现效果再次非常接近完美了。

然而，随着测试的不断进行，发现在极个别人物的个别表情下，可能会出现闪动的奇怪问题。

经过思考和查阅资料后意识到，尽管同一个表情做成的 webm 文件比全部帧动画加起来的尺寸要小很多，但是比帧动画中的一帧图片还是要大不少的。由于视频需要完全加载后才能播放，可能由此导致了在视频加载前的数个毫秒的时间出现闪动。

对此，需要通过 Movie 的 start_image 属性，提供一张首屏图片，视频没有加载完成的时候就会使用这张图片作为显示，避免闪动问题。

最终代码如下：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm", side_mask = True, start_image = "characters/napoleon/happy.png")
    renpy.image("linpicio happy", Transform(movie, zoom = 1.5))
```

## 如何将帧动画转换为 webm

接下来的问题自然就变成了：如何根据帧动画素材生成 webm？如何生成 webm 的遮罩？又怎么把两个视频拼在一起？

可以通过 ffmpeg 实现，并通过 node 脚本批量调用生成。

这正是本项目所做的工作，具体细节不在此赘述（因为其实我也不太懂 ffmpeg）。

## 那么我需要做什么？

1. 下载工具包。
2. 将图片资源（jpg 或 png 格式）按照 人物名/表情名/文件 的三级目录结构放置在 img_source 目录下，表情的文件名需要是 001.png、002.png 这种格式。
3. 双击运行 exe 文件。
4. 观察提示，等待程序运行完成。
5. 检查 webm_result 目录下的产物，将其复制到你的 renpy 项目中的 characters 目录下，之后就可以在 renpy 项目中使用了。


## live2d 还是 webm？

首先如果你的项目中的帧动画并不是用 live2d 实现的（比如手绘像素动画、骨骼动画等），那只能考虑帧动画转 webm 了。

其次由于 Renpy 的 live2d 目前还不支持安卓和 Web 端，所以如果目标发布的平台包括这两个平台的话，最好也使用 webm。

排除以上两点后，考虑到 live2d 的内容较为丰富，包含蒙皮、部位切分、动作等各种概念，并非单纯的静态播片，将来可能会提供更灵活多样的支持（比如在不同动画之间平滑过渡而不是硬切，甚至分部位动态控制等），如果对 live2d 技术栈较为熟悉的话，推荐使用 live2d。


## 不只是人物立绘？

人物立绘只是本项目的由来和典型使用场景，但其实能导出为帧动画的任何技术栈、非全屏、包含透明度的动画都可以使用本项目进行动画制作。

## 自定义配置

工具包中的 config.json 文件打开后可以看到一些自定义配置项。

大部分默认就是最优配置了，注意 fps 帧率可以根据素材情况自定义修改。

```
{
  // 是否删除中间生成的 origin、mask 等 webm 文件，默认删除节省空间保持目录干净
  "deleteMiddleWebm": true,
  // ffmpeg 命令输入文件的匹配格式，如果不知道含义不要改动
  // 默认是匹配 001.jpg 这样的文件，如果文件数量达到了四位数，可以改成%04d,
  "ffmpegInputPattern": "%03d",
  // 是否自动复制素材的第一张图作为首屏图
  "copyFirstImage": true,
  // 输出文件的帧率，最好与帧动画素材的帧率保持一致
  "fps": 30,
}
```