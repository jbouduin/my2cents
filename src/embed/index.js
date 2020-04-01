import My2Cents from './client';

(function() {
    const script = document.querySelector('script[data-my2cents-target]');
    if (!script) return console.warn('my2cents script tag needs some data attributes');

    const opts = script.dataset;
    var slug = opts.my2centsSlug;
    const url = new URL(document.URL);
    const host = `${url.protocol}//${url.host}`;
    console.log(host);
    const partials = {
        Preview: `Preview`,
        Edit: `Edit`,
        SendComment: `Send comment`,
        Cancel: `Cancel`,
        Or: `Or`,
        Mute: `mute notifications`,
        UnMute: `unmute`,
        PostComment: `Post a comment. Markdown is supported!`,
        AdminApproval: `This comment is still waiting for your approval`,
        WaitingForApproval: `Your comment is still waiting for approval by the site owner`,
        SignInVia: `To post a comment you need to sign in via`,
        Reply: `<i class='icon my2cents-icon-reply'></i> reply`,
        LoginStatus:
            "(signed in as <span class='my2cents-user'>@%USER%</span> :: <a class='my2cents-signout' href='#'>sign out</a>)"
    };

    Object.keys(partials).forEach(k => {
        if (script.dataset[`my2centsPartial${k}`])
            partials[k] = script.dataset[`my2centsPartial${k}`];
    });

    // eslint-disable-next-line no-new
    new My2Cents({
        target: opts.my2centsTarget,
        slug,
        host,
        partials
    });
})();
