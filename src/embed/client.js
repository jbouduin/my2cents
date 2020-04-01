import fetch from 'unfetch';
import my2cents_tpl from './my2cents.jst.html';
import comments_tpl from './comments.jst.html';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

export default class My2Cents {
  constructor(options) {

    this.options = options;
    this.options.endpoint = `${options.host}/${options.root}/comments/${options.slug}`;
    this.initialized = false;
    this.firstLoad = true;

    this.refresh();
  }

  refresh() {
    const { target, slug, host, root, endpoint, partials } = this.options;

    fetch(
      endpoint,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }
    )
    .then(r => r.json())
    .then(data => {
      data.comments_tpl = comments_tpl;
      data.partials = partials;
      $(target).innerHTML = my2cents_tpl(data);

      const above = $(`${target} div.my2cents-new-comment`);
      const form = $(`${target} div.my2cents-form`);
      const textarea = $(`${target} textarea.my2cents-body`);
      const preview = $(`${target} .my2cents-form blockquote.my2cents-body`);

      const draft = window.localStorage.getItem(`my2cents-draft-${slug}`);
      if (draft && textarea) {
        textarea.value = draft;
      }

      const postBtn = $(target + ' .my2cents-post');
      const previewBtn = $(target + ' .my2cents-preview');
      const writeBtn = $(target + ' .my2cents-write');
      const cancelReplyBtn = $(target + ' .my2cents-cancel-reply');
      const replyBtns = $$(target + ' .my2cents-reply');

      if (postBtn) {
        postBtn.addEventListener('click', d => {
          const body = textarea.value;
          fetch(
            endpoint,
            {
              credentials: 'include',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ comment: body, replyTo: form.dataset.reply })
            }
          )
          .then(r => r.json())
          .then(res => {
            textarea.value = '';
            window.localStorage.setItem(
              `my2cents-draft-${slug}`,
              textarea.value
            );
            if (res.id) {
              this.firstLoad = true;
              window.location.hash = '#comment-' + res.id;
            }
            this.refresh();
          });
        });

        previewBtn.addEventListener('click', d => {
          const body = textarea.value;
          textarea.style.display = 'none';
          previewBtn.style.display = 'none';
          preview.style.display = 'block';
          writeBtn.style.display = 'inline';
          fetch(
            `${host}/${root}/markdown`,
            {
              credentials: 'include',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ comment: body })
            })
          .then(r => r.json())
          .then(res => { preview.innerHTML = res.html; });
        });

        writeBtn.addEventListener('click', d => {
          textarea.style.display = 'inline';
          previewBtn.style.display = 'inline';
          preview.style.display = 'none';
          writeBtn.style.display = 'none';
        });

        textarea.addEventListener('keyup', () => {
          window.localStorage.setItem(`my2cents-draft-${slug}`, textarea.value);
        });

        replyBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            form.dataset.reply = btn.dataset.replyTo;
            cancelReplyBtn.style.display = 'inline-block';
            btn.parentElement.appendChild(form);
          });
        });

        cancelReplyBtn.addEventListener('click', () => {
          above.appendChild(form);
          delete form.dataset.reply;
          cancelReplyBtn.style.display = 'none';
        });
      }

      if (data.user) {
        const signout = $('.my2cents-logout');
        if (signout) {
          signout.addEventListener('click', e => {
            e.preventDefault();
            fetch(
              `${host}/${root}/auth/signout`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            })
            .then(() => this.refresh());
          });
        }
      } else {
        data.auth.forEach(provider => {
          const btn = $(target + ' .my2cents-signin-' + provider.id);
          if (btn) {
            btn.addEventListener('click', d => {
              const signin = (provider_domain = '') => {
                let windowRef = window.open(
                  `${host}/auth/${provider.id}` + (provider_domain ? `/d/${provider_domain}` : ''),
                  provider.name + ' Sign-In',
                  'resizable,scrollbars,status,width=600,height=500'
                );
                window.__my2cents_wait_for_oauth = () => {
                  windowRef.close();
                  this.refresh();
                };
              };
              if (provider.id === 'anonymous') {
                let windowRef = window.open(
                  `${host}/${root}/auth/anonymous`,
                  'Post anonymously',
                  'resizable,scrollbars,status,width=600,height=500'
                );
                window.__my2cents_wait_for_oauth = () => {
                  windowRef.close();
                  this.refresh();
                };
              } else {
                signin();
              }
            });
          }
        });
      }

      if (data.user && data.user.admin) {
        if (!this.initialized) {
          const push = document.createElement('script');
          push.setAttribute('src', `${host}/${root}/push.js`);
          document.head.appendChild(push);
          this.initialized = true;
        }

        const action = evt => {
          const btn = evt.target;
          const data = btn.dataset;
          fetch(
            `${host}/${data.class}/${data.target}/${data.action}`,
            {
              credentials: 'include',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: ''
            })
            .then(() => this.refresh());
          };
          document.querySelectorAll('.my2cents-admin-action').forEach(btn => {
            btn.addEventListener('click', action);
          });
        }

      if (this.firstLoad && window.location.hash.match(/^#comment-\d+$/)) {
        const hl = document.querySelector(window.location.hash);
        hl.scrollIntoView();
        hl.classList.add('my2cents-highlight');
        this.firstLoad = false;
      }
    });
  }
}
