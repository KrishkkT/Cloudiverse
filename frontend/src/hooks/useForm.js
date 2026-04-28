import { useState } from 'react';

const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate on blur
    if (validationRules[name]) {
      const error = validationRules[name](values[name]);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  };

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(validationRules).forEach(key => {
      const error = validationRules[key](values[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    
    // If no errors, submit
    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    }
  };

  const reset = () => {
    setValues(initialValues || {});
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
};

export default useForm;