/** Height of top crate, which is where the grappler works. Crates that are dropped 
    at this height will cause the grappler to crash. 
    The value is 6. So crate 0 to crate 6 are possible, which are 7 crates.
    But crate 6 would cause a crash. 
*/

module conf
{
    export function getMaxCrateHeight(): number { return 6; };
    /** Maximum platforms that a level can use. */
    export function getMaxPlatforms(): number { return 8; };

    /** Is this a mobile (phone/tablet/handheld...)? */
    export function isMobile(): boolean { 
        var isMobile = false; //initiate as false
        // device detection
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge|maemo|midp|mmp|netfront|operam(ob|in)i|palm(os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows(ce|phone)|xda|xiino/i.test(navigator.userAgent))
        { isMobile = true; }
        return isMobile;
    }

    export function debug(): boolean {
        try {
            return document.URL.match(/debug/i) !== null
        } catch (e) { return false; }
    }
}