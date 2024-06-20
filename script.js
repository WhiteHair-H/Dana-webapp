document.addEventListener('DOMContentLoaded', (event) => {
    loadComments();
    document.getElementById('loginPopup').style.display = 'block';
});

function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'block';
}

function hidePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function showLogin() {
    hidePopup('idCreatePopup');
    hidePopup('passwordResetPopup');
    showPopup('loginPopup');
}

function showIdCreate() {
    hidePopup('loginPopup');
    showPopup('idCreatePopup');
}

function showPasswordReset() {
    hidePopup('loginPopup');
    showPopup('passwordResetPopup');
}

function login() {
    const name = document.getElementById('loginName').value;
    const password = document.getElementById('loginPassword').value;

    db.collection("users").where("name", "==", name).where("password", "==", password)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    localStorage.setItem('currentUser', JSON.stringify(doc.data()));
                    hidePopup('loginPopup');
                });
            } else {
                alert('로그인 정보가 올바르지 않습니다.');
            }
        })
        .catch((error) => {
            console.error("Error logging in: ", error);
        });
}

function createId() {
    const name = document.getElementById('createName').value;
    const password = document.getElementById('createPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const rrn = document.getElementById('rrn').value;

    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (isNaN(rrn) || rrn.length !== 7) {
        alert('주민등록번호 뒷자리 형식이 잘못되었습니다.');
        return;
    }

    const user = { name, password, rrn };
    db.collection("users").add(user)
        .then(() => {
            alert('ID가 생성되었습니다.');
            showLogin();
        })
        .catch((error) => {
            console.error("Error creating ID: ", error);
        });
}

function resetPassword() {
    const name = document.getElementById('resetName').value;
    const rrn = document.getElementById('resetRrn').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    db.collection("users").where("name", "==", name).where("rrn", "==", rrn)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    db.collection("users").doc(doc.id).update({
                        password: newPassword
                    });
                    alert('비밀번호가 재설정되었습니다.');
                    showLogin();
                });
            } else {
                alert('입력 정보가 올바르지 않습니다.');
            }
        })
        .catch((error) => {
            console.error("Error resetting password: ", error);
        });
}

function loadComments() {
    const commentSection = document.getElementById('comments');
    commentSection.innerHTML = '';
    db.collection("comments").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                displayComment(doc.data());
            });
        })
        .catch((error) => {
            console.error("Error loading comments: ", error);
        });
}

function addComment() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        showLogin();
        return;
    }

    const booktitle = document.getElementById('booktitle').value;
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const content = document.getElementById('content').value;
    const datetime = new Date().toLocaleString();

    if (booktitle && rating && content) {
        const newComment = {
            nickname: currentUser.name,
            booktitle,
            rating,
            content,
            datetime,
            id: new Date().getTime().toString()
        };
        db.collection("comments").doc(newComment.id).set(newComment)
            .then(() => {
                displayComment(newComment);
                document.getElementById('booktitle').value = '';
                document.getElementById('content').value = '';
                document.querySelector('input[name="rating"]:checked').checked = false;
            })
            .catch((error) => {
                console.error("Error adding comment: ", error);
            });
    } else {
        alert('모든 필드를 입력해주세요.');
    }
}

function displayComment(comment) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const commentSection = document.getElementById('comments');
    const newComment = document.createElement('div');
    newComment.classList.add('comment');
    newComment.innerHTML = `
        <p class="nickname">${comment.nickname}</p>
        <p class="book-title">책 제목: ${comment.booktitle}</p>
        <p class="rating"> ${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</p>
        <p>${comment.content}</p>
        <p class="datetime">${comment.datetime}</p>
        ${currentUser && currentUser.name === comment.nickname ? `<button onclick="confirmDelete('${comment.id}')">삭제</button>` : ''}
    `;
    commentSection.insertBefore(newComment, commentSection.firstChild);
}

function confirmDelete(commentId) {
    const result = confirm('정말 이 댓글을 삭제하시겠습니까?');
    if (result) {
        deleteComment(commentId);
    }
}

function deleteComment(commentId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    db.collection("comments").doc(commentId).get()
        .then((doc) => {
            if (doc.exists && doc.data().nickname === currentUser.name) {
                db.collection("comments").doc(commentId).delete()
                    .then(() => {
                        loadComments();
                    })
                    .catch((error) => {
                        console.error("Error deleting comment: ", error);
                    });
            } else {
                alert('댓글을 삭제할 권한이 없습니다.');
            }
        })
        .catch((error) => {
            console.error("Error getting comment: ", error);
        });
}
