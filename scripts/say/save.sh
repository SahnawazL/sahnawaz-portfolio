#!/bin/bash
# keeps each finished clip, so a long run can't lose work
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A audio/say
git diff --cached --quiet && exit 0
git commit -q -m "Listen clips: pre-made voice and music"
for n in 1 2 3 4; do git pull -q --rebase origin main && git push -q origin HEAD:main && exit 0; sleep 6; done
