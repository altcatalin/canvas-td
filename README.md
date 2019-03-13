# Canvas TD

A Tower Defense game with real objects as towers.  
This is a wrap around [Teddy's Canvas TD](https://canvas-td.teddy.io) for [Lampix tabletop AR](https://lampix.com/). The interactions are transformed into mouse events for the legacy app.

Video attached to this [tweet](https://twitter.com/altcatalin/status/1105961945209950210)

[Lampix Apps API](https://api.lampix.co/)

## Usage

-   clone repository
-   update `config.json` with the maximum heights of the objects that are used as towers
-   `npm install`
-   `npm run build`
-   upload the `.zip` file from `dist-x.y.z` directory to Lampix (directly to device or through MyLampix)

## Todo

-   [ ] call UI actions directly from watcher's callback and remove event listeners
-   [ ] implement tower management (move, sell, upgrade etc)
-   [ ] update UI (buttons etc)
-   [ ] ...
