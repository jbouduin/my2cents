import My2Cents from './client';

(function() {
    const script = document.querySelector('script[data-m2c-target]');
    if (!script) return console.warn('My2Cents script tag needs some data attributes');

    const opts = script.dataset;
    const slug = opts.m2cSlug;
    const root = opts.m2cRoot;
    const url = new URL(document.URL);
    const host = `${url.protocol}//${url.host}`;

    const partials = {
        Preview: `Preview`,
        Edit: `Edit`,
        SendComment: `Send comment`,
        Cancel: `Cancel`,
        Or: `Or`,
        Mute: `Mute notifications`,
        UnMute: `Unmute notifications`,
        CommentPlaceholder: `Post a comment. Markdown is supported!`,
        AdminApproval: `This comment is still waiting for your approval`,
        WaitingForApproval: `Your comment is still waiting for approval by the site owner`,
        SignInVia: `To post a comment you need to sign in via`,
        Add: `Add a new comment`,
        FirstAdd: `Add the first comment`,
        FirstSignInVia: `To post the first comment you need to sign in via`,
        Reply: `<i class='icon m2c-icon-reply'></i> reply`,
        LoginStatus:
            "(signed in as <span class='m2c-user'>@%USER%</span> :: <a class='m2c-signout' href='#'>sign out</a>)"
    };

    Object.keys(partials).forEach(k => {
        if (script.dataset[`m2cPartial${k}`])
            partials[k] = script.dataset[`m2cPartial${k}`];
    });

    // eslint-disable-next-line no-new
    new My2Cents({
        target: opts.m2cTarget,
        root,
        slug,
        host,
        partials
    });
})();
