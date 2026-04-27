# Swiper 轮播组件

## 组件

| 组件 | 说明 |
|------|------|
| `DuSwiper` | 轮播容器 |
| `DuSwiperItem` | 轮播项 |

## DuSwiper Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `indicatorType` | `'bar-full' \| 'bar' \| 'number'` | `'bar'` | 指示条类型 |
| `autoplay` | `boolean` | `false` | 自动轮播 |

## 用法

```vue
<DuSwiper autoplay indicator-type="bar">
  <DuSwiperItem>
    <img src="banner1.jpg" />
  </DuSwiperItem>
  <DuSwiperItem>
    <img src="banner2.jpg" />
  </DuSwiperItem>
</DuSwiper>
```

## 骨架翻译

骨架中的 `<Swiper>` / `<Banner>` / `<Carousel>` → `DuSwiper`
骨架中的 `<SwiperItem>` → `DuSwiperItem`

## 组件引入

```ts
import { DuSwiper, DuSwiperItem } from 'your-ui-lib'
```
