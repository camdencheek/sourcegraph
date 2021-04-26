import classnames from 'classnames';
import React, { forwardRef, InputHTMLAttributes } from 'react';

import styles from './FormField.module.scss';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement>{
    title?: string;
    description?: string;
    className?: string
    error?: string;
    valid?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    (props, reference) => {
        const { title, description, className, valid, error, ...otherProps } = props;

        return (
            <label className={classnames(styles.formField, className)}>
                {title && <h4>{title}</h4>}

                <input
                    type="text"
                    className={classnames(
                        styles.formFieldInput,
                        'form-control',
                        { 'is-valid': valid, 'is-invalid': !!error }
                    )}
                    {...otherProps}
                    ref={reference}
                />

                { error && <span className={styles.formFieldError}>*{ error }</span> }
                { !error && description &&
                <span className={classnames(styles.formFieldDescription, 'text-muted')}>
                    {description}
                </span>
                }
            </label>
        );
    }
)
