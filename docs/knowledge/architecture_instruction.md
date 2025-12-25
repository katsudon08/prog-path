# FSDの設計とルール

Layers・Slices・Segments
FSD最大の特徴は冒頭にあった図のようなLayers・Slices・Segmentsの3つの階層構造です。

![alt text](image.png)

[Layers]

app: アプリ全体の設定、スタイル、Providerなど。
processes: 認証などの複雑なpages間のプロセス。
pages: entities/features/widgetsからページを構成するLayer。
widgets: entitiesとfeaturesを意味のあるブロックに結合するLayer。(e.g. IssuesList、UserProfile)
features: ユーザーとのインタラクションや、ビジネス価値をもたらす機能。(e.g. SendComment、AddToCart、UsersSearch)
entities: ビジネスドメインのエンティティ。(e.g. User, Product, Order)
shared: プロジェクト/ビジネスの詳細から切り離された、再利用可能な機能。(e.g. UIKit、ライブラリ、API)

これらのLayer間の依存は一方向にのみ許可され、上位のLayerは下位のLayerにのみ依存できます。最上位のLayersはappです。

```
app > processes > pages > features > entities > shared
```

[Slices]

Layers直下はSlicesと呼ばれる第2階層を持ちます。SlicesはFSDによる命名ではなく、ビジネスロジックに基づいてディレクトリが作成されるため、プロジェクトに強く依存します。

以下はディレクトリ構成の例と、各LayersにおけるSlicesの切り方の指針です。

```
├── app/
|   # Does not have specific slices,
|   # Because it contains meta-logic on the project and its initialization
├── processes/
|   # Slices implementing processes on pages
|   ├── payment
|   ├── auth
|   ├── quick-tour
|   └── ...
├── pages/
|   # Slices implementing application pages
|   # At the same time, due to the specifics of routing, they can be invested in each other
|   ├── profile
|   ├── sign-up
|   ├── feed
|   └── ...
├── widgets/
|   # Slices implementing independent page blocks
|   ├── header
|   ├── feed
|   └── ...
├── features/
|   # Slices implementing user scenarios on pages
|   ├── auth-by-phone
|   ├── inline-post
|   └── ...
├── entities/
|   # Slices of business entities for implementing a more complex BL
|   ├── viewer
|   ├── posts
|   ├── i18n
|   └── ...
├── shared/
|    # Does not have specific slices
|    # is rather a set of commonly used segments, without binding to the BL
```

同じLayerに属するSlicesは、お互いに依存してはいけません。これは依存関係を明確にすること、そしてビジネスロジックを凝集するために非常に重要なルールです。

[Segments]

Slices配下はSegmentsと呼ばれ、実装の目的に応じてファイルやディレクトリが分けられます。以下は例です。

```
{layer}/
    ├── {slice}/
    |   ├── ui/                     # UI-logic (components, ui-widgets,...)
    |   ├── model/                  # Business logic (store, actions, effects, reducers,...)
    |   ├── lib/                    # Infrastructure logic (utils/helpers)
    |   ├── config*/                # Configuration (of the project / slice)
    |   └── api*/                   # Logic of API requests (api instances, requests,...)
```


Public API

コンセプト:Public APIにもありましたが、FSDでは公開モジュールはすべて各Slicesのindex.tsのみに存在します。外部公開前のモジュールは、AuthFormではなくFormのように短い命名にしてre export時にユニークな命名に変更することが推奨されています。

```
// features/auth-form/index.ts
export { Form as AuthForm } from "./ui";
export * as authFormModel from "./model";
```

```
// features/post-form/index.ts
export { Form as PostForm } from "./ui";
export * as postFormModel from "./model";
```

```
// usecase
import { AuthForm, authFormModel } from "features/auth-form";
import { PostForm, postFormModel } from "features/post-form";
```

## 段階的な導入

FSDは段階的な導入が可能です。FSDでは過去の経験や研究に基づき、以下のような段階的導入を提案しています。プロジェクトに応じて調整しつつ、基本は以下の手順に則することが推奨されています。

1. appとsharedから作成し、土台を気づきます。通常これらのLayerは最小です。
2. FSD の規則に違反する依存関係がある場合でも、すべてのUIをwidgetとpagesに分類します。
3. featuresとentitiesを分離し、pagesとwidgetsを純粋な合成Layerに徐々に変えていくことで、分解の精度を徐々に高めていきます。