import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/loginPage.css';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/apis/authApi';
import { loginSuccess } from '@/redux/authSlice';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import OtpModal from './otpModal';
import Otp from './otpPage';
import EnterNewPasswordModal from './enterNewPasswordModal';

const ForgetPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        phoneNumber: '',

    });

    const [errors, setErrors] = useState({
        phoneNumber: false,

        general: ''
    });


    const [openOtpModal, setOpenOtpModal] = useState(false);
    const [showEnterPasswordModal, setShowEnterPasswordModal] = useState(false);

    const { mutate, isPending } = useMutation({
        mutationFn: (phone) => forgotPassword(phone),
        onSuccess: (data) => {
            setOpenOtpModal(true)
        },
        onError: (err) => {
            setErrors((prev) => ({
                ...prev,
                general:
                    err?.response?.data?.message || "Invalid credentials",
            }));
        },
    });

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
    };


    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: false,
            general: ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {
            phoneNumber: false,
            general: ''
        };

        const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');

        if (!cleanPhone || !validatePhoneNumber(cleanPhone)) {
            newErrors.phoneNumber = true;
        }


        if (newErrors.phoneNumber) return;

        mutate(

            cleanPhone

        );
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

   

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="bg-red-500 login-title">Forget password</h1>
                    <p className="login-subtitle">Enter your phone number to reset your password</p>
                </div>

                <div className="login-form">
                    {errors.general && (
                        <div className="general-error">
                            {errors.general}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) =>
                                handleInputChange('phoneNumber', e.target.value)
                            }
                           
                            className={`form-input ${errors.phoneNumber ? 'error' : ''
                                }`}
                            autoComplete="tel"
                            placeholder="Enter your phone number"
  maxLength={10}
  pattern="[0-9]{10}"
                        />
                        {errors.phoneNumber && (
                            <span className="error-message">
                                Please enter a valid phone number
                            </span>
                        )}
                    </div>

                  

                    <button
                        onClick={handleSubmit}
                        className={`login-btn login-btn-primary ${isPending ? 'loading' : ''
                            }`}
                        disabled={isPending}
                    >
                        {isPending ? 'Requesting OTP...' : 'Request OTP'}
                    </button>
                    <p className="signup-link">Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </div>
            </div>
            <OtpModal open={openOtpModal} onClose={() => setOpenOtpModal(false)} phone={formData.phoneNumber} >
                <Otp
                    phone={formData.phoneNumber}
                    type="FORGOT_PASSWORD"
                    onSuccess={() => {
                    setOpenOtpModal(false);
                    setShowEnterPasswordModal(true);

                    }}>
                </Otp>
            </OtpModal>
            <EnterNewPasswordModal open={showEnterPasswordModal} onClose={() => setShowEnterPasswordModal(false)}  >
            </EnterNewPasswordModal>
       

        </div>

    );
};

export default ForgetPassword;