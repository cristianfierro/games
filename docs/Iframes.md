iframes and deployment

On MediaOS we'll fire the iFrameResizer (currently via Ensighten, since there is no embed code purpose-built for games yet)
We'll always include the component part in the iFrame.
Docs: http://davidjbradshaw.github.io/iframe-resizer/

One single iframe is capable of loading any game type. It first loads the essential common elements, then the JS code will load the extras or game type specific files (js and css and images)

Editors can embed the ifram by obtaining the HTML from the editor, then pasting that into the HTML view in MediaOS
