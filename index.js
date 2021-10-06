import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import validRegister from '../../assets/Utils/ValidateData/ValidRegister';
import settings from '../../json/settings.json';
import theme from '../../json/theme.json';
import InputField from '../../snnipets/InputField';
import { showAppModal } from '../../store/Actions/AppModal';
import { login, logout } from '../../store/Actions/Auth';
import { endSpinLoader, startSpinLoader } from '../../store/Actions/SpinLoader';
import { createPendingUser, updatePendingUser } from '../../assets/Services/Api/User/PendingUser';
import { sendEmailAccountVerification } from '../../assets/Services/Api/Email';
import { userLogin } from '../../assets/Services/Api/Auth';
import { getReduxStore } from '../../assets/Utils';

function FormLogin({
  children, isRegister, autofocus, readOnly,
}) {
  const dispatch = useDispatch();
  const { pageTitle } = getReduxStore();
  const [userData, setUserData] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();
  const [pendingUserEmail, setPendingUserEmail] = useState('');

  const [submitStatus, setSubmitStatus] = useState({
    emailMessage: '',
    passwordMessage: '',
    emailAlreadyExist: '',
  });

  const handleResendVerificationEmail = async () => {
    if (!pendingUserEmail) return;
    dispatch(startSpinLoader());
    const res = await updatePendingUser(pendingUserEmail);
    if (!res.success) {
      dispatch(endSpinLoader());
      dispatch(showAppModal({
        title: 'Erro',
        body: res.err,
        error: true,
      }));
      return;
    }
    const send = await sendEmailAccountVerification({
      clientEmail: pendingUserEmail,
      clientName: userData.name,
      type: 'account verification',
      link: `${settings.absoluteWebsiteUrl}${settings.pageName.autentication}${res.token}`,
    });
    if (!send.success) {
      dispatch(showAppModal({
        title: 'Erro',
        body: send.msg,
        error: true,
      }));
      dispatch(endSpinLoader());
      return;
    }
    dispatch(endSpinLoader());
    dispatch(showAppModal({
      title: 'Verifique seu email',
      body: res.success,
      error: false,
    }));
    dispatch(logout());
  };

  const handleOnBlurChange = (e) => {
    const { name, value } = e.target;

    const validEmail = name === 'email' ? value : userData.email;
    const validPassword = name === 'password' ? value : userData.password;

    const validResponse = validRegister(
      validEmail,
      validPassword,
      name,
    );

    setSubmitStatus({
      ...submitStatus,
      ...validResponse,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { emailMessage, passwordMessage } = validRegister(userData.email, userData.password, 'form');
    setSubmitStatus({
      emailMessage,
      passwordMessage,
    });
    if (emailMessage || passwordMessage) {
      return;
    }

    dispatch(startSpinLoader());
    let res = {};
    if (isRegister) {
      res = await createPendingUser(userData);
      if (res.emailMessage === 'Registro pendente.') setPendingUserEmail(userData.email);
      if ((res.emailMessage && pageTitle !== 'landingPage')
      || res.emailMessage === 'Registro pendente.') {
        setSubmitStatus({
          emailMessage: res.emailMessage,
        });
      }

      if (res.err) {
        dispatch(showAppModal({
          title: 'Erro',
          body: res.err,
          error: true,
        }));
      }

      if (res.success) {
        if (userData.email.indexOf('@modelo.bot') !== -1) {
          router.push(`${settings.absoluteWebsiteUrl}${settings.pageName.autentication}${res.token}`);
          dispatch(endSpinLoader());
          return;
        }
        dispatch(showAppModal({
          title: 'Verifique seu email',
          body: res.success,
          error: false,
        }));
        dispatch(logout());
      }

      if (((res.emailMessage && pageTitle !== 'landingPage') || res.emailMessage === 'Registro pendente.')
        || res.err
        || res.success) {
        dispatch(endSpinLoader());
        return;
      }
    }

    if (!isRegister
      || (res.emailMessage && pageTitle === 'landingPage')) {
      res = await userLogin(userData);
      if (res.emailMessage) {
        setSubmitStatus({
          emailMessage: res.emailMessage,
        });
      }
      if (res.passwordMessage) {
        setSubmitStatus({
          passwordMessage: res.passwordMessage,
        });
      }
      if (res.err) {
        dispatch(showAppModal({
          title: 'Erro',
          body: res.err,
          error: true,
        }));
      }
      if (res.emailMessage || res.passwordMessage || res.err) {
        dispatch(endSpinLoader());
        return;
      }
    }
    dispatch(logout());
    dispatch(login(res.refreshToken));

    dispatch(endSpinLoader());
    if (pageTitle === 'landingPage') router.push(settings.pageName.incomeTax);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        marginTop: '40px',
      }}
    >
      <InputField
        autofocus={autofocus}
        submitMessage={submitStatus.emailMessage}
        userDataInfo={userData.email}
        onChange={handleInputChange}
        onBlur={handleOnBlurChange}
        initialMessage="E-mail principal"
        type="email"
        value={userData.email}
        idAndName={`email_isRegister_${isRegister}`}
        readOnly={readOnly}
      />
      <InputField
        submitMessage={submitStatus.passwordMessage}
        userDataInfo={userData.password}
        onChange={handleInputChange}
        onBlur={handleOnBlurChange}
        initialMessage="Senha"
        type="password"
        value={userData.password}
        idAndName={`password_isRegister_${isRegister}`}
        readOnly={readOnly}
      />
      {
        isRegister
        && submitStatus.emailMessage === 'Registro pendente.' ? (
          <ResendEmail>
            <div>
              <i className="fas fa-caret-right" />
              <span onClick={handleResendVerificationEmail}>
                Reenviar email
              </span>
            </div>
          </ResendEmail>
          ) : null
      }
      {children}
    </form>
  );
}

const ResendEmail = styled.div`

  margin-top: -0.5rem;
  margin-bottom: .75rem;
  margin-left: 0;  
  display: flex;
  alignItems: left;

  div{
    cursor: pointer;
    padding: 5px 10px;
  }

  i{
    margin-right: 3px; 
    font-size: 14px;
    color: ${theme.colors.link};
    transition: all 0s linear;
  }

  span{
    color: ${theme.colors.link};
    font-size: 14px;
    cursor: pointer;
    transition: all 0s linear;
  }

  div:hover{
    span{
      text-decoration: underline;
      color: ${theme.colors.blue};
    }
    i{
      color: ${theme.colors.blue};
    }
  }
`;

export default FormLogin;
